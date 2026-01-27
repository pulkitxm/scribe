import Foundation

public func getSystemVolume() -> Int {
    let task = Process()
    task.launchPath = "/usr/bin/osascript"
    task.arguments = ["-e", "output volume of (get volume settings)"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
           let volume = Int(output) {
            return volume
        }
    }
    return -1
}
