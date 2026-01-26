import AppKit
import Foundation

let homeDir = FileManager.default.homeDirectoryForCurrentUser
let screenshotDir = homeDir.appendingPathComponent("screenshots/ss-tool").path
let interval: TimeInterval = 5

try? FileManager.default.createDirectory(atPath: screenshotDir, withIntermediateDirectories: true)

func takeScreenshot() {
    let timestamp = DateFormatter()
    timestamp.dateFormat = "yyyy-MM-dd_HH-mm-ss"
    let filename = "screenshot_\(timestamp.string(from: Date())).png"
    let filepath = "\(screenshotDir)/\(filename)"

    let task = Process()
    task.launchPath = "/usr/sbin/screencapture"
    task.arguments = ["-x", filepath]
    task.launch()
    task.waitUntilExit()

    if FileManager.default.fileExists(atPath: filepath) {
        let avifPath = filepath.replacingOccurrences(of: ".png", with: ".avif")
        let ffmpeg = Process()

        let possiblePaths = [
            "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg",
        ]
        var ffmpegPath = "/opt/homebrew/bin/ffmpeg"

        for path in possiblePaths {
            if FileManager.default.fileExists(atPath: path) {
                ffmpegPath = path
                break
            }
        }

        ffmpeg.launchPath = ffmpegPath
        ffmpeg.launchPath = ffmpegPath
        ffmpeg.arguments = [
            "-hide_banner", "-loglevel", "error", "-y",
            "-i", filepath,
            "-vf", "scale=1280:-1",
            "-c:v", "libaom-av1",
            "-crf", "30",
            "-b:v", "0",
            "-cpu-used", "6",
            avifPath,
        ]
        ffmpeg.launch()
        ffmpeg.waitUntilExit()

        try? FileManager.default.removeItem(atPath: filepath)
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

print("📸 Screenshot tool started.")
print("   Saving to: \(screenshotDir)")
print("   Interval: \(interval)s")

while true {
    if shouldTakeScreenshot() {
        takeScreenshot()
    } else {
        fflush(stdout)
    }
    Thread.sleep(forTimeInterval: interval)
}
