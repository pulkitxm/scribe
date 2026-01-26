import Foundation
import AppKit

public func getExecutableDir() -> String {
    let processPath = ProcessInfo.processInfo.arguments[0]
    return URL(fileURLWithPath: processPath).deletingLastPathComponent().path
}

public func resolvePath(for tool: String) -> String? {
    // 1. Try reading from config.json in the executable directory
    if tool == "node" {
        let configPath = "\(getExecutableDir())/config.json"
        if FileManager.default.fileExists(atPath: configPath) {
            if let data = FileManager.default.contents(atPath: configPath),
               let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: String],
               let nodePath = json["nodePath"], !nodePath.isEmpty {
                return nodePath
            }
        }
    }

    // 2. Try 'which' command
    let task = Process()
    task.launchPath = "/usr/bin/which"
    task.arguments = [tool]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    if task.terminationStatus == 0 {
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !path.isEmpty {
            return path
        }
    }
    
    // 3. Fallback known paths
    let commonPaths = [
        "/opt/homebrew/bin/\(tool)",
        "/usr/local/bin/\(tool)",
        "/usr/bin/\(tool)"
    ]
    
    for path in commonPaths {
        if FileManager.default.fileExists(atPath: path) {
            return path
        }
    }
    
    return nil
}

public func shouldTakeScreenshot() -> Bool {
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
