import Foundation

public struct CPUInfo {
    public let totalCores: Int
    public let usagePercent: Double
    public let idlePercent: Double
}

public func getCPUUsage() -> CPUInfo {
    let totalCores = ProcessInfo.processInfo.processorCount
    
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/top")
        task.arguments = ["-l", "1", "-n", "0", "-stats", "cpu"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                let lines = output.components(separatedBy: .newlines)
                for line in lines {
                    if line.contains("CPU usage:") {
                        let pattern = "([0-9.]+)% user.*?([0-9.]+)% sys.*?([0-9.]+)% idle"
                        if let regex = try? NSRegularExpression(pattern: pattern),
                           let match = regex.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) {
                            if let userRange = Range(match.range(at: 1), in: line),
                               let sysRange = Range(match.range(at: 2), in: line),
                               let idleRange = Range(match.range(at: 3), in: line),
                               let user = Double(line[userRange]),
                               let sys = Double(line[sysRange]),
                               let idle = Double(line[idleRange]) {
                                return CPUInfo(totalCores: totalCores, usagePercent: user + sys, idlePercent: idle)
                            }
                        }
                    }
                }
            }
        }
    } catch {
        
    }
    return CPUInfo(totalCores: totalCores, usagePercent: 0, idlePercent: 100)
}
