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
        let audioInfo = getAudioInfo()
        env["SCRIBE_VOLUME"] = String(audioInfo.volume)
        env["SCRIBE_AUDIO_MUTED"] = String(audioInfo.isMuted)
        
        if let inputsJson = try? JSONSerialization.data(withJSONObject: audioInfo.inputs.map({ [
            "name": $0.name,
            "manufacturer": $0.manufacturer,
            "transport": $0.transport,
            "is_default": $0.isDefaultInput
        ] }), options: []), let inputsString = String(data: inputsJson, encoding: .utf8) {
            env["SCRIBE_AUDIO_INPUTS"] = inputsString
        }
        
        if let outputsJson = try? JSONSerialization.data(withJSONObject: audioInfo.outputs.map({ [
            "name": $0.name,
            "manufacturer": $0.manufacturer,
            "transport": $0.transport,
            "is_default": $0.isDefaultOutput
        ] }), options: []), let outputsString = String(data: outputsJson, encoding: .utf8) {
            env["SCRIBE_AUDIO_OUTPUTS"] = outputsString
        }
        
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
        
        let network = getNetworkInfo()
        env["SCRIBE_NETWORK_CONNECTED"] = String(network.connected)
        env["SCRIBE_NETWORK_TYPE"] = network.type
        env["SCRIBE_NETWORK_SSID"] = network.ssid
        env["SCRIBE_NETWORK_LOCAL_IP"] = network.localIP
        env["SCRIBE_NETWORK_SIGNAL"] = String(network.signalStrength)
        env["SCRIBE_NETWORK_LINK_SPEED"] = String(network.linkSpeed)
        env["SCRIBE_NETWORK_RX_BYTES"] = String(network.rxBytes)
        env["SCRIBE_NETWORK_TX_BYTES"] = String(network.txBytes)
        env["SCRIBE_NETWORK_CHANNEL"] = String(network.channel)
        env["SCRIBE_NETWORK_BSSID"] = network.bssid
        
        let displayInfo = getDisplayInfo()
        env["SCRIBE_BRIGHTNESS"] = String(displayInfo.brightness)
        env["SCRIBE_DARK_MODE"] = String(displayInfo.darkMode)
        
        var externalDisplaysJson: [[String: Any]] = []
        for display in displayInfo.externalDisplays {
            externalDisplaysJson.append([
                "name": display.name,
                "width": display.width,
                "height": display.height,
                "is_main": display.isMain,
                "display_id": display.displayId
            ])
        }
        if let jsonData = try? JSONSerialization.data(withJSONObject: externalDisplaysJson, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            env["SCRIBE_EXTERNAL_DISPLAYS"] = jsonString
        } else {
            env["SCRIBE_EXTERNAL_DISPLAYS"] = "[]"
        }
        
        let inputIdle = getInputIdleInfo()
        env["SCRIBE_IDLE_SECONDS"] = String(format: "%.1f", inputIdle.idleSeconds)
        
        let now = Date()
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        env["SCRIBE_TIMESTAMP_ISO"] = isoFormatter.string(from: now)
        env["SCRIBE_TIMESTAMP_UNIX"] = String(Int64(now.timeIntervalSince1970 * 1000))
        env["SCRIBE_TIMEZONE"] = TimeZone.current.identifier
        
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "EEEE"
        env["SCRIBE_DAY_OF_WEEK"] = dayFormatter.string(from: now)
        
        let hourFormatter = DateFormatter()
        hourFormatter.dateFormat = "HH"
        let hour = Int(hourFormatter.string(from: now)) ?? 0
        var timeOfDay = "night"
        if hour >= 5 && hour < 12 {
            timeOfDay = "morning"
        } else if hour >= 12 && hour < 17 {
            timeOfDay = "afternoon"
        } else if hour >= 17 && hour < 21 {
            timeOfDay = "evening"
        }
        env["SCRIBE_TIME_OF_DAY"] = timeOfDay
        
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
