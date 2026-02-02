import Foundation
import AppKit

public func getExecutableDir() -> String {
    let processPath = ProcessInfo.processInfo.arguments[0]
    return URL(fileURLWithPath: processPath).deletingLastPathComponent().path
}

public func resolvePath(for tool: String) -> String? {
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

    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        task.arguments = [tool]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !path.isEmpty {
                return path
            }
        }
    } catch {
        
    }
    
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

public func getEnvVar(_ key: String) -> String? {
    let envPath = "\(getExecutableDir())/.env"
    guard let content = try? String(contentsOfFile: envPath, encoding: .utf8) else {
        return nil
    }

    let lines = content.components(separatedBy: .newlines)
    for line in lines {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty || trimmed.hasPrefix("#") { continue }
        
        let parts = trimmed.components(separatedBy: "=")
        if parts.count >= 2 {
            let k = parts[0].trimmingCharacters(in: .whitespaces)
            if k == key {
                var v = parts.dropFirst().joined(separator: "=").trimmingCharacters(in: .whitespaces)
                if (v.hasPrefix("\"") && v.hasSuffix("\"")) || (v.hasPrefix("'") && v.hasSuffix("'")) {
                    v = String(v.dropFirst().dropLast())
                }
                return v
            }
        }
    }
    return nil
}

func getSystemIdleTime() -> Double? {
    var iterator: io_iterator_t = 0
    let result = IOServiceGetMatchingServices(kIOMainPortDefault, IOServiceMatching("IOHIDSystem"), &iterator)
    
    if result == KERN_SUCCESS {
        let entry = IOIteratorNext(iterator)
        if entry != 0 {
            var dict: Unmanaged<CFMutableDictionary>? = nil
            IORegistryEntryCreateCFProperties(entry, &dict, kCFAllocatorDefault, 0)
            
            if let properties = dict?.takeRetainedValue() as? [String: Any] {
                if let idleTimeNanoseconds = properties["HIDIdleTime"] as? UInt64 {
                    IOObjectRelease(entry)
                    IOObjectRelease(iterator)
                    return Double(idleTimeNanoseconds) / 1_000_000_000.0
                }
            }
            IOObjectRelease(entry)
        }
        IOObjectRelease(iterator)
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
    
    if let idleTime = getSystemIdleTime(), idleTime > 60.0 {
        return false
    }

    return true
}
