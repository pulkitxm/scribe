import Foundation

struct Analyzer {
    public static func analyzeImage(path: String, captureDuration: TimeInterval, convertDuration: TimeInterval) {
        guard let nodePath = resolvePath(for: "node") else {
            Logger.shared.log("Node.js not found.")
            return
        }
        
        let executableDir = getExecutableDir()
        let visionScriptPath = "\(executableDir)/vision.js"

        if !FileManager.default.fileExists(atPath: visionScriptPath) {
             Logger.shared.log("vision.js not found at: \(visionScriptPath)")
             return
        }
        
        runNode(nodePath: nodePath, scriptPath: visionScriptPath, imagePath: path, captureDuration: captureDuration, convertDuration: convertDuration)
    }

    private static func runNode(nodePath: String, scriptPath: String, imagePath: String, captureDuration: TimeInterval, convertDuration: TimeInterval) {
        let startAnalysis = Date()
        let nodeProcess = Process()
        nodeProcess.launchPath = nodePath
        nodeProcess.arguments = [scriptPath, imagePath]

        Logger.shared.log("Processing screenshot...")
        
        let pipe = Pipe()
        nodeProcess.standardOutput = pipe
        nodeProcess.standardError = pipe
        
        var env = ProcessInfo.processInfo.environment
        env["SCRIBE_ACTIVE_APP"] = getActiveAppName()
        env["SCRIBE_OPENED_APPS"] = getOpenedApps().joined(separator: ", ")
        env["SCRIBE_BATTERY"] = getBatteryLevel()
        env["SCRIBE_BATTERY_PERCENT"] = String(getBatteryPercentage())
        env["SCRIBE_IS_PLUGGED"] = String(isPluggedIntoPower())
        env["SCRIBE_VOLUME"] = String(getSystemVolume())
        
        let ram = getRAMUsage()
        env["SCRIBE_RAM_TOTAL"] = String(ram.total)
        env["SCRIBE_RAM_USED"] = String(ram.used)
        env["SCRIBE_RAM_FREE"] = String(ram.free)
        
        let storage = getStorageUsage()
        env["SCRIBE_STORAGE_TOTAL"] = String(storage.total)
        env["SCRIBE_STORAGE_USED"] = String(storage.used)
        env["SCRIBE_STORAGE_FREE"] = String(storage.free)
        
        let cpu = getCPUUsage()
        env["SCRIBE_CPU_CORES"] = String(cpu.totalCores)
        env["SCRIBE_CPU_USED"] = String(format: "%.1f", cpu.usagePercent)
        env["SCRIBE_CPU_IDLE"] = String(format: "%.1f", cpu.idlePercent)
        
        nodeProcess.environment = env
        
        nodeProcess.launch()
        
        let handle = pipe.fileHandleForReading
        handle.readabilityHandler = { pipeHandle in
            let data = pipeHandle.availableData
            if data.count > 0 {
                if let output = String(data: data, encoding: .utf8) {
                    print(output, terminator: "")
                    if let fh = Logger.shared.fileHandle {
                         fh.trace(data)
                    }
                }
            }
        }
        
        nodeProcess.waitUntilExit()
        
        handle.readabilityHandler = nil
        
        let analysisDuration = Date().timeIntervalSince(startAnalysis)
        let totalDuration = captureDuration + convertDuration + analysisDuration

        if nodeProcess.terminationStatus == 0 {
            Logger.shared.log(String(format: "Processed in %.1fs (Screen: %.1fs, Convert: %.1fs, Analyze: %.1fs)", totalDuration, captureDuration, convertDuration, analysisDuration))
        } else {
            Logger.shared.log("Analysis failed.")
        }
    }
}
