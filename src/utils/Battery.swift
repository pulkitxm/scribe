import Foundation

public func getBatteryLevel() -> String {
    let task = Process()
    task.launchPath = "/usr/bin/pmset"
    task.arguments = ["-g", "batt"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    var result = ""
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            let lines = output.components(separatedBy: .newlines)
            for line in lines {
                if line.contains("Now drawing from") {
                    result += line.replacingOccurrences(of: "Now drawing from", with: "").trimmingCharacters(in: .whitespaces) + ": "
                }
                if line.contains("InternalBattery") {
                    let parts = line.components(separatedBy: "\t")
                    if parts.count > 1 {
                        result += parts[1].trimmingCharacters(in: .whitespaces)
                    }
                }
            }
        }
    }
    return result.isEmpty ? "Unknown" : result
}

public func getBatteryPercentage() -> Int {
    let task = Process()
    task.launchPath = "/usr/bin/pmset"
    task.arguments = ["-g", "batt"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            let pattern = "([0-9]+)%"
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: output, range: NSRange(output.startIndex..., in: output)) {
                if let range = Range(match.range(at: 1), in: output),
                   let percent = Int(output[range]) {
                    return percent
                }
            }
        }
    }
    return -1
}

public func isPluggedIntoPower() -> Bool {
    let task = Process()
    task.launchPath = "/usr/bin/pmset"
    task.arguments = ["-g", "batt"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            return output.contains("AC Power")
        }
    }
    return false
}
