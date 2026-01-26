import Foundation

struct ScreenshotManager {
    static let homeDir = FileManager.default.homeDirectoryForCurrentUser
    static let screenshotDir = homeDir.appendingPathComponent("screenshots/ss-tool").path
    
    static func takeScreenshot() {
        let startTime = Date()
        let timestamp = DateFormatter()
        timestamp.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let filename = "screenshot_\(timestamp.string(from: Date())).png"
        let filepath = "\(screenshotDir)/\(filename)"
        
        // Ensure directory exists
        try? FileManager.default.createDirectory(atPath: screenshotDir, withIntermediateDirectories: true)

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
                Analyzer.analyzeImage(path: webpPath, captureDuration: captureDuration, convertDuration: convertDuration)
            } else {
                Logger.shared.log("❌ Image conversion failed.")
            }
        } else {
            Logger.shared.log("❌ Screenshot file NOT found.")
        }
    }
}
