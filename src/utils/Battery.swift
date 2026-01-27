import Foundation

private func runPmsetBatt() -> String? {
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/pmset")
        task.arguments = ["-g", "batt"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            return String(data: data, encoding: .utf8)
        }
    } catch {
        // Silently fail
    }
    return nil
}

public func getBatteryLevel() -> String {
    guard let output = runPmsetBatt() else {
        return "Unknown"
    }
    
    var result = ""
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
    return result.isEmpty ? "Unknown" : result
}

public func getBatteryPercentage() -> Int {
    guard let output = runPmsetBatt() else {
        return -1
    }
    
    let pattern = "([0-9]+)%"
    if let regex = try? NSRegularExpression(pattern: pattern),
       let match = regex.firstMatch(in: output, range: NSRange(output.startIndex..., in: output)) {
        if let range = Range(match.range(at: 1), in: output),
           let percent = Int(output[range]) {
            return percent
        }
    }
    return -1
}

public func isPluggedIntoPower() -> Bool {
    guard let output = runPmsetBatt() else {
        return false
    }
    return output.contains("AC Power")
}
