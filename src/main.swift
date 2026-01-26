import Foundation

let interval: TimeInterval = 5
let screenshotDir = ScreenshotManager.screenshotDir

let runOnce = CommandLine.arguments.contains("--run-once")

Logger.shared.log("Scribe started.")
Logger.shared.log("   Saving to: \(screenshotDir)")
Logger.shared.log("   Interval: \(interval)s")
if runOnce {
    Logger.shared.log("   Mode: Run Once")
}

while true {
    if shouldTakeScreenshot() {
        ScreenshotManager.takeScreenshot()
    } else {
        fflush(stdout)
    }
    
    if runOnce {
        break
    }
    
    Thread.sleep(forTimeInterval: interval)
}
