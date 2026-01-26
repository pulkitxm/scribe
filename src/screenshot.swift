import AppKit
import Foundation

let homeDir = FileManager.default.homeDirectoryForCurrentUser
let screenshotDir = homeDir.appendingPathComponent("screenshots/ss-tool").path
let interval: TimeInterval = 5

try? FileManager.default.createDirectory(atPath: screenshotDir, withIntermediateDirectories: true)

// Custom Logger
class Logger {
    static let shared = Logger()
    var fileHandle: FileHandle?
    
    private init() {
        let currentDir = FileManager.default.currentDirectoryPath
        let logsDir = URL(fileURLWithPath: currentDir).appendingPathComponent("logs")
        let logFile = logsDir.appendingPathComponent("app.log")
        
        do {
            try FileManager.default.createDirectory(at: logsDir, withIntermediateDirectories: true)
            if !FileManager.default.fileExists(atPath: logFile.path) {
                FileManager.default.createFile(atPath: logFile.path, contents: nil)
            }
            fileHandle = try FileHandle(forWritingTo: logFile)
            fileHandle?.seekToEndOfFile()
        } catch {
            print("Failed to setup logger: \(error)")
        }
    }
    
    func log(_ message: String) {
        // Console output
        print(message)
        
        // File output
        let timestamp = DateFormatter()
        timestamp.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let logEntry = "[\(timestamp.string(from: Date()))] \(message)\n"
        
        if let data = logEntry.data(using: .utf8) {
            fileHandle?.write(data)
        }
    }
}

func resolvePath(for tool: String) -> String? {
    let task = Process()
    task.launchPath = "/usr/bin/which"
    task.arguments = [tool]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !path.isEmpty {
            return path
        }
    }
    
    // Fallback known paths
    let commonPaths = [
        "/opt/homebrew/bin/\(tool)",
        "/usr/local/bin/\(tool)",
        "/usr/bin/\(tool)"
    ]
    
    for path in commonPaths {
        if FileManager.default.fileExists(atPath: path) {
            return path
        }
    }
    
    return nil
}

func takeScreenshot() {
    let startTime = Date()
    let timestamp = DateFormatter()
    timestamp.dateFormat = "yyyy-MM-dd_HH-mm-ss"
    let filename = "screenshot_\(timestamp.string(from: Date())).png"
    let filepath = "\(screenshotDir)/\(filename)"
    
    // Logger.shared.log("📸 Taking screenshot to \(filepath)")

    let task = Process()
    task.launchPath = "/usr/sbin/screencapture"
    task.arguments = ["-x", filepath]
    task.launch()
    task.waitUntilExit()
    
    let captureDuration = Date().timeIntervalSince(startTime)

    if task.terminationStatus != 0 {
        Logger.shared.log("❌ screencapture failed. Please ensure the terminal has Screen Recording permissions.")
        return
    }

    if FileManager.default.fileExists(atPath: filepath) {
        let webpPath = filepath.replacingOccurrences(of: ".png", with: ".webp")
        
        guard let ffmpegPath = resolvePath(for: "ffmpeg") else {
            Logger.shared.log("❌ ffmpeg not found.")
            return
        }
        
        let convertStart = Date()
        let ffmpeg = Process()
        ffmpeg.launchPath = ffmpegPath
        ffmpeg.arguments = [
            "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-i", filepath,
            "-vf", "scale=1280:-1",
            "-c:v", "libwebp",
            "-q:v", "75",
            webpPath,
        ]
        ffmpeg.launch()
        ffmpeg.waitUntilExit()
        
        let convertDuration = Date().timeIntervalSince(convertStart)

        try? FileManager.default.removeItem(atPath: filepath)

        // Analyze the image
        if FileManager.default.fileExists(atPath: webpPath) {
            analyzeImage(path: webpPath, captureDuration: captureDuration, convertDuration: convertDuration)
        } else {
            Logger.shared.log("❌ Image conversion failed.")
        }
    } else {
        Logger.shared.log("❌ Screenshot file NOT found.")
    }
}

func analyzeImage(path: String, captureDuration: TimeInterval, convertDuration: TimeInterval) {
    guard let nodePath = resolvePath(for: "node") else {
        Logger.shared.log("❌ Node.js not found.")
        return
    }
    
    let currentDir = FileManager.default.currentDirectoryPath
    let visionScriptPath = "\(currentDir)/vision.js"

    if !FileManager.default.fileExists(atPath: visionScriptPath) {
        // Fallback: Check if we are in src and vision.js is one level up
        let parentDir = URL(fileURLWithPath: currentDir).deletingLastPathComponent().path
        let parentVisionPath = "\(parentDir)/vision.js"
        if FileManager.default.fileExists(atPath: parentVisionPath) {
             runNode(nodePath: nodePath, scriptPath: parentVisionPath, imagePath: path, captureDuration: captureDuration, convertDuration: convertDuration)
             return
        }

        Logger.shared.log("⚠️ vision.js not found.")
        return
    }
    
    runNode(nodePath: nodePath, scriptPath: visionScriptPath, imagePath: path, captureDuration: captureDuration, convertDuration: convertDuration)
}

func runNode(nodePath: String, scriptPath: String, imagePath: String, captureDuration: TimeInterval, convertDuration: TimeInterval) {
    let startAnalysis = Date()
    let nodeProcess = Process()
    nodeProcess.launchPath = nodePath
    nodeProcess.arguments = [scriptPath, imagePath]

    Logger.shared.log("📸 Processing screenshot...")
    
    // Capture stdout/stderr to log them
    let pipe = Pipe()
    nodeProcess.standardOutput = pipe
    nodeProcess.standardError = pipe
    
    nodeProcess.environment = ProcessInfo.processInfo.environment
    
    nodeProcess.launch()
    
    let handle = pipe.fileHandleForReading
    handle.readabilityHandler = { pipeHandle in
        let data = pipeHandle.availableData
        if data.count > 0 {
            if let output = String(data: data, encoding: .utf8) {
                // Determine if we print to console (we want to preserve existing behavior)
                // Existing behavior was: node process inherits stdout/stderr, so it streams.
                // Here we print it manually.
                print(output, terminator: "")
                
                // Write to log file
                // Strip color codes for log file? simplistic regex or just dump raw
                // Let's dump raw for now, or minimal strip. Simpler is raw.
                if let fh = Logger.shared.fileHandle {
                     try? fh.trace(data)
                }
            }
        }
    }
    
    nodeProcess.waitUntilExit()
    
    // Clean up handler
    handle.readabilityHandler = nil
    
    let analysisDuration = Date().timeIntervalSince(startAnalysis)
    let totalDuration = captureDuration + convertDuration + analysisDuration

    if nodeProcess.terminationStatus == 0 {
        Logger.shared.log(String(format: "✅ Processed in %.1fs (Screen: %.1fs, Convert: %.1fs, Analyze: %.1fs)", totalDuration, captureDuration, convertDuration, analysisDuration))
    } else {
        Logger.shared.log("❌ Analysis failed.")
    }
}

// Extension to help writing data
extension FileHandle {
    func trace(_ data: Data) {
        self.seekToEndOfFile()
        self.write(data)
    }
}

func shouldTakeScreenshot() -> Bool {
    if CGDisplayIsActive(CGMainDisplayID()) == 0 {
        return false
    }

    if let sessionInfo = CGSessionCopyCurrentDictionary() as? [String: Any] {
        if let onConsole = sessionInfo["kCGSessionOnConsoleKey"] as? Bool, !onConsole {
            return false
        }

        if let locked = sessionInfo["CGSSessionScreenIsLocked"] as? Bool, locked {
            return false
        }
    }

    return true
}

// Check for run-once flag
let runOnce = CommandLine.arguments.contains("--run-once")

Logger.shared.log("📸 Screenshot tool started.")
Logger.shared.log("   Saving to: \(screenshotDir)")
Logger.shared.log("   Interval: \(interval)s")
if runOnce {
    Logger.shared.log("   Mode: Run Once")
}

while true {
    if shouldTakeScreenshot() {
        takeScreenshot()
    } else {
        fflush(stdout)
    }
    
    if runOnce {
        break
    }
    
    Thread.sleep(forTimeInterval: interval)
}
