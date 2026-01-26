import Foundation
import AppKit

// Configuration
let homeDir = FileManager.default.homeDirectoryForCurrentUser
let screenshotDir = homeDir.appendingPathComponent("screenshots/ss-tool").path
let interval: TimeInterval = 5

// Create directory if needed
try? FileManager.default.createDirectory(atPath: screenshotDir, withIntermediateDirectories: true)

func takeScreenshot() {
    let timestamp = DateFormatter()
    timestamp.dateFormat = "yyyy-MM-dd_HH-mm-ss"
    let filename = "screenshot_\(timestamp.string(from: Date())).png"
    let filepath = "\(screenshotDir)/\(filename)"
    
    // Use screencapture command
    let task = Process()
    task.launchPath = "/usr/sbin/screencapture"
    task.arguments = ["-x", filepath]
    task.launch()
    task.waitUntilExit()
    
    // Convert to WebP using ffmpeg
    if FileManager.default.fileExists(atPath: filepath) {
        let avifPath = filepath.replacingOccurrences(of: ".png", with: ".avif")
        let ffmpeg = Process()
        
        // Find ffmpeg path - fallback to common locations if not in PATH
        let possiblePaths = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"]
        var ffmpegPath = "/opt/homebrew/bin/ffmpeg" // Default fallback
        
        for path in possiblePaths {
           if FileManager.default.fileExists(atPath: path) {
               ffmpegPath = path
               break
           }
        }
        
        ffmpeg.launchPath = ffmpegPath
        // Optimize: Resize to 1280px width, encode to AVIF (libaom-av1)
        // crf 30 is good quality, cpu-used 6 is faster encoding speed
        ffmpeg.arguments = [
            "-hide_banner", "-loglevel", "error", "-y", 
            "-i", filepath, 
            "-vf", "scale=1280:-1", 
            "-c:v", "libaom-av1",
            "-crf", "30",
            "-b:v", "0",
            "-cpu-used", "6",
            avifPath
        ]
        ffmpeg.launch()
        ffmpeg.waitUntilExit()
        
        // Remove PNG
        try? FileManager.default.removeItem(atPath: filepath)
    }
}

// MARK: - Screen State Detection

func shouldTakeScreenshot() -> Bool {
    // 1. Check if display is active (sleeping?)
    if CGDisplayIsActive(CGMainDisplayID()) == 0 {
        return false
    }

    // 2. Check session state (locked? on console?)
    if let sessionInfo = CGSessionCopyCurrentDictionary() as? [String: Any] {
        // kCGSessionOnConsoleKey: true if we are the active user on the console
        if let onConsole = sessionInfo["kCGSessionOnConsoleKey"] as? Bool, !onConsole {
            return false
        }
        
        // kCGSessionScreenIsLocked: true if screen is locked
        // Note: The key is "CGSSessionScreenIsLocked", usually boolean-like or 1/0
        if let locked = sessionInfo["CGSSessionScreenIsLocked"] as? Bool, locked {
            return false
        }
    }

    return true
}

// MARK: - Main Loop

print("📸 Screenshot tool started.")
print("   Saving to: \(screenshotDir)")
print("   Interval: \(interval)s")

while true {
    if shouldTakeScreenshot() {
        takeScreenshot()
    } else {
        // Optional: print only once per state change to avoid log spam, 
        // but for now simple logging is fine for debugging.
        // To reduce spam, we can just silence it or print a dot.
        // print(".", terminator: "") 
        fflush(stdout)
    }
    Thread.sleep(forTimeInterval: interval)
}
