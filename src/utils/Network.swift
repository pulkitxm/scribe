import Foundation
import CoreWLAN

public struct NetworkInfo {
    public let connected: Bool
    public let type: String
    public let ssid: String
    public let localIP: String
    public let signalStrength: Int
    public let linkSpeed: Int
    public let rxBytes: UInt64
    public let txBytes: UInt64
    public let channel: Int
    public let bssid: String
}

public func getNetworkInfo() -> NetworkInfo {
    var networkType = "unknown"
    var ssid = ""
    var connected = false
    var localIP = ""
    var signalStrength = 0
    var linkSpeed = 0
    var rxBytes: UInt64 = 0
    var txBytes: UInt64 = 0
    var channel = 0
    var bssid = ""
    
    let wifiClient = CWWiFiClient.shared()
    if let interface = wifiClient.interface() {
        let rssi = interface.rssiValue()
        
        if rssi < 0 && rssi > -100 {
            networkType = "wifi"
            connected = true
            signalStrength = rssi
            
            if let currentSSID = interface.ssid(), !currentSSID.isEmpty {
                ssid = currentSSID
            } else {
                let fallbackSSID = getSSIDFromNetworkSetup()
                if !fallbackSSID.hasPrefix("(") {
                    ssid = fallbackSSID
                }
            }
            
            if let wlanChannel = interface.wlanChannel() {
                channel = wlanChannel.channelNumber
            }
            if let currentBSSID = interface.bssid() {
                bssid = currentBSSID
            }
            let txRate = interface.transmitRate()
            if txRate > 0 {
                linkSpeed = Int(txRate)
            }
        }
    }
    
    if !connected {
        let interfaces = ["en0", "en1", "en2", "en3", "en4", "en5"]
        for iface in interfaces {
            let ifaceInfo = getInterfaceInfo(interface: iface)
            if ifaceInfo.isActive && !ifaceInfo.ip.isEmpty {
                connected = true
                localIP = ifaceInfo.ip
                if networkType != "wifi" {
                    networkType = "ethernet"
                }
                break
            }
        }
    }
    
    if connected && localIP.isEmpty {
        localIP = getLocalIPAddress()
    }
    
    let netStats = getNetworkStats()
    rxBytes = netStats.rx
    txBytes = netStats.tx
    
    if !connected {
        if checkInternetConnectivity() {
            connected = true
            networkType = "other"
        }
    }
    
    return NetworkInfo(
        connected: connected,
        type: networkType,
        ssid: ssid,
        localIP: localIP,
        signalStrength: signalStrength,
        linkSpeed: linkSpeed,
        rxBytes: rxBytes,
        txBytes: txBytes,
        channel: channel,
        bssid: bssid
    )
}

private func getSSIDFromNetworkSetup() -> String {
    let networksetupPath = "/usr/sbin/networksetup"
    guard FileManager.default.fileExists(atPath: networksetupPath) else {
        return ""
    }
    
    for iface in ["en0", "en1"] {
        do {
            let task = Process()
            task.executableURL = URL(fileURLWithPath: networksetupPath)
            task.arguments = ["-getairportnetwork", iface]
            
            let pipe = Pipe()
            task.standardOutput = pipe
            task.standardError = FileHandle.nullDevice
            task.standardInput = FileHandle.nullDevice
            
            try task.run()
            task.waitUntilExit()
            
            if task.terminationStatus == 0 {
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                if let output = String(data: data, encoding: .utf8) {
                    let trimmed = output.trimmingCharacters(in: .whitespacesAndNewlines)
                    if trimmed.contains("Current Wi-Fi Network:") && !trimmed.contains("not associated") {
                        let parts = trimmed.components(separatedBy: ":")
                        if parts.count >= 2 {
                            let networkName = parts.dropFirst().joined(separator: ":").trimmingCharacters(in: .whitespaces)
                            if !networkName.isEmpty {
                                return networkName
                            }
                        }
                    }
                }
            }
        } catch {
            continue
        }
    }
    
    return "(Location permission required)"
}

private struct InterfaceInfo {
    let isActive: Bool
    let ip: String
}

private func getInterfaceInfo(interface: String) -> InterfaceInfo {
    let ifconfigPath = "/sbin/ifconfig"
    guard FileManager.default.fileExists(atPath: ifconfigPath) else {
        return InterfaceInfo(isActive: false, ip: "")
    }
    
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: ifconfigPath)
        task.arguments = [interface]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        var isActive = false
        var ip = ""
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                isActive = output.contains("status: active")
                
                let pattern = "inet\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)"
                if let regex = try? NSRegularExpression(pattern: pattern),
                   let match = regex.firstMatch(in: output, range: NSRange(output.startIndex..., in: output)) {
                    if let range = Range(match.range(at: 1), in: output) {
                        ip = String(output[range])
                    }
                }
            }
        }
        
        return InterfaceInfo(isActive: isActive, ip: ip)
    } catch {
        return InterfaceInfo(isActive: false, ip: "")
    }
}

private func getLocalIPAddress() -> String {
    for iface in ["en0", "en1", "en2"] {
        let info = getInterfaceInfo(interface: iface)
        if !info.ip.isEmpty {
            return info.ip
        }
    }
    return ""
}

private struct NetworkStats {
    let rx: UInt64
    let tx: UInt64
}

private func getNetworkStats() -> NetworkStats {
    let netstatPath = "/usr/sbin/netstat"
    guard FileManager.default.fileExists(atPath: netstatPath) else {
        return NetworkStats(rx: 0, tx: 0)
    }
    
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: netstatPath)
        task.arguments = ["-ibn"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        var totalRx: UInt64 = 0
        var totalTx: UInt64 = 0
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8) {
                let lines = output.components(separatedBy: "\n")
                for line in lines {
                    if line.hasPrefix("en") && !line.contains("Link#") {
                        let cols = line.split(separator: " ").map { String($0) }
                        if cols.count >= 10 {
                            if let rx = UInt64(cols[6]), let tx = UInt64(cols[9]) {
                                totalRx += rx
                                totalTx += tx
                            }
                        }
                    }
                }
            }
        }
        
        return NetworkStats(rx: totalRx, tx: totalTx)
    } catch {
        return NetworkStats(rx: 0, tx: 0)
    }
}

private func checkInternetConnectivity() -> Bool {
    let pingPath = "/sbin/ping"
    guard FileManager.default.fileExists(atPath: pingPath) else {
        return false
    }
    
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: pingPath)
        task.arguments = ["-c", "1", "-t", "1", "8.8.8.8"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = FileHandle.nullDevice
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        return task.terminationStatus == 0
    } catch {
        return false
    }
}
