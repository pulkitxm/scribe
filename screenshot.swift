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
        let webpPath = filepath.replacingOccurrences(of: ".png", with: ".webp")
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
        // Optimize: Resize to 1280px width (auto height) and quality 50
        ffmpeg.arguments = [
            "-hide_banner", "-loglevel", "error", "-y", 
            "-i", filepath, 
            "-vf", "scale=1280:-1", 
            "-quality", "50", 
            webpPath
        ]
        ffmpeg.launch()
        ffmpeg.waitUntilExit()
        
        // Remove PNG
        try? FileManager.default.removeItem(atPath: filepath)
    }
}

// Main loop
while true {
    takeScreenshot()
    Thread.sleep(forTimeInterval: interval)
}
