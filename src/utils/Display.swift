import Foundation
import AppKit

public struct ExternalDisplayInfo {
    public let name: String
    public let width: Int
    public let height: Int
    public let isMain: Bool
    public let displayId: UInt32
}

public struct DisplayInfo {
    public let brightness: Int
    public let darkMode: Bool
    public let externalDisplays: [ExternalDisplayInfo]
}

public func getDisplayInfo() -> DisplayInfo {
    let brightness = getDisplayBrightness()
    let darkMode = getDarkModeStatus()
    let externalDisplays = getExternalDisplays()
    return DisplayInfo(brightness: brightness, darkMode: darkMode, externalDisplays: externalDisplays)
}

private func getDisplayBrightness() -> Int {
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        task.arguments = ["-e", "tell application \"System Events\" to tell appearance preferences to return (brightness of main display) * 100"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
               let brightness = Double(output) {
                return Int(brightness)
            }
        }
    } catch {
        
    }
    
    do {
        let ioTask = Process()
        ioTask.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        ioTask.arguments = ["-e", """
            use framework "Foundation"
            use framework "IOKit"
            use scripting additions
            
            set brightnessValue to do shell script "ioreg -c AppleBacklightDisplay | grep brightness | head -1 | sed 's/.*\"brightness\"=\\([0-9]*\\).*/\\1/'"
            if brightnessValue is not "" then
                return (brightnessValue as number) / 1024 * 100
            else
                return -1
            end if
        """]
        
        let ioPipe = Pipe()
        ioTask.standardOutput = ioPipe
        ioTask.standardError = FileHandle.nullDevice
        ioTask.standardInput = FileHandle.nullDevice
        
        try ioTask.run()
        ioTask.waitUntilExit()
        
        if ioTask.terminationStatus == 0 {
            let data = ioPipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
               let brightness = Double(output), brightness >= 0 {
                return Int(brightness)
            }
        }
    } catch {
        
    }
    
    return -1
}

private func getDarkModeStatus() -> Bool {
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/defaults")
        task.arguments = ["read", "-g", "AppleInterfaceStyle"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) {
                return output.lowercased() == "dark"
            }
        }
    } catch {
        
    }
    
    return false
}

private func getExternalDisplays() -> [ExternalDisplayInfo] {
    var displays: [ExternalDisplayInfo] = []
    let mainDisplayId = CGMainDisplayID()
    
    var displayCount: UInt32 = 0
    CGGetActiveDisplayList(0, nil, &displayCount)
    
    if displayCount == 0 {
        return displays
    }
    
    var activeDisplays = [CGDirectDisplayID](repeating: 0, count: Int(displayCount))
    CGGetActiveDisplayList(displayCount, &activeDisplays, &displayCount)
    
    for displayId in activeDisplays {
        let width = CGDisplayPixelsWide(displayId)
        let height = CGDisplayPixelsHigh(displayId)
        let isMain = displayId == mainDisplayId
        let displayName = getDisplayName(displayId: displayId)
        
        if displayId != mainDisplayId || displayCount == 1 {
            displays.append(ExternalDisplayInfo(
                name: displayName,
                width: width,
                height: height,
                isMain: isMain,
                displayId: displayId
            ))
        }
    }
    
    if displays.isEmpty && displayCount > 0 {
        let mainDisplay = ExternalDisplayInfo(
            name: getDisplayName(displayId: mainDisplayId),
            width: CGDisplayPixelsWide(mainDisplayId),
            height: CGDisplayPixelsHigh(mainDisplayId),
            isMain: true,
            displayId: mainDisplayId
        )
        displays.append(mainDisplay)
    }
    
    return displays
}

private func getDisplayName(displayId: CGDirectDisplayID) -> String {
    if CGDisplayIsBuiltin(displayId) != 0 {
        return "Built-in Display"
    }
    
    let vendorId = CGDisplayVendorNumber(displayId)
    let modelId = CGDisplayModelNumber(displayId)
    
    let knownVendors: [UInt32: String] = [
        1552: "Samsung",
        4268: "Dell",
        7789: "LG",
        16652: "ASUS",
        4098: "HP",
        1507: "Acer",
        4957: "ViewSonic",
        5765: "BenQ",
        16507: "AOC",
        1138: "Apple"
    ]
    
    if let vendorName = knownVendors[vendorId] {
        return "\(vendorName) Display (\(modelId))"
    }
    
    if vendorId > 0 && modelId > 0 {
        return "External Display (\(vendorId)-\(modelId))"
    }
    
    return "External Display"
}
