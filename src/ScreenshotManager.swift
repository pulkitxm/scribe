import Foundation

struct ScreenshotManager {
    static var baseDir: String {
        if let customFolder = getEnvVar("SCRIBE_FOLDER"), !customFolder.isEmpty {
            return customFolder
        }
        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        return homeDir.appendingPathComponent("screenshots/scribe").path
    }
    
    static var screenshotDir: String {
        let date = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "d-M-yyyy"
        let dateString = formatter.string(from: date)
        return (baseDir as NSString).appendingPathComponent(dateString)
    }
    
    static func takeScreenshot() {
        let startTime = Date()
        let currentDir = screenshotDir
        
        let timestamp = DateFormatter()
        timestamp.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let filename = "screenshot_\(timestamp.string(from: Date())).png"
        let filepath = (currentDir as NSString).appendingPathComponent(filename)
        
        try? FileManager.default.createDirectory(atPath: currentDir, withIntermediateDirectories: true)

        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
        task.arguments = ["-x", filepath]
        task.standardOutput = FileHandle.nullDevice
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        do {
            try task.run()
            task.waitUntilExit()
        } catch {
            Logger.shared.log("screencapture failed to launch: \(error.localizedDescription)")
            return
        }
        
        let captureDuration = Date().timeIntervalSince(startTime)

        if task.terminationStatus != 0 {
            Logger.shared.log("screencapture failed. Please ensure the terminal has Screen Recording permissions.")
            return
        }

        if FileManager.default.fileExists(atPath: filepath) {
            let webpPath = filepath.replacingOccurrences(of: ".png", with: ".webp")
            
            guard let ffmpegPath = resolvePath(for: "ffmpeg") else {
                Logger.shared.log("ffmpeg not found.")
                return
            }
            
            let convertStart = Date()
            let ffmpeg = Process()
            ffmpeg.executableURL = URL(fileURLWithPath: ffmpegPath)
            ffmpeg.arguments = [
                "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                "-i", filepath,
                "-vf", "scale=1280:-1",
                "-c:v", "libwebp",
                "-q:v", "75",
                webpPath,
            ]
            ffmpeg.standardOutput = FileHandle.nullDevice
            ffmpeg.standardError = FileHandle.nullDevice
            ffmpeg.standardInput = FileHandle.nullDevice
            
            do {
                try ffmpeg.run()
                ffmpeg.waitUntilExit()
            } catch {
                Logger.shared.log("ffmpeg failed to launch: \(error.localizedDescription)")
                return
            }
            
            let convertDuration = Date().timeIntervalSince(convertStart)

            try? FileManager.default.removeItem(atPath: filepath)

            if FileManager.default.fileExists(atPath: webpPath) {
                Analyzer.analyzeImage(path: webpPath, captureDuration: captureDuration, convertDuration: convertDuration)
            } else {
                Logger.shared.log("Image conversion failed.")
            }
        } else {
            Logger.shared.log("Screenshot file NOT found.")
        }
    }
}
