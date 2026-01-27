import Foundation
import CoreAudio

public struct AudioDevice {
    public let name: String
    public let manufacturer: String
    public let transport: String
    public let isInput: Bool
    public let isOutput: Bool
    public let isDefaultInput: Bool
    public let isDefaultOutput: Bool
}

public struct AudioInfo {
    public let volume: Int
    public let isMuted: Bool
    public let inputs: [AudioDevice]
    public let outputs: [AudioDevice]
}

public func getAudioInfo() -> AudioInfo {
    let volumeInfo = getSystemVolumeAndMute()
    let devices = getCoreAudioDevices()
    
    let inputs = devices.filter { $0.isInput }
    let outputs = devices.filter { $0.isOutput }
    
    return AudioInfo(
        volume: volumeInfo.volume,
        isMuted: volumeInfo.isMuted,
        inputs: inputs,
        outputs: outputs
    )
}

public func getSystemVolume() -> Int {
    return getSystemVolumeAndMute().volume
}

private func getSystemVolumeAndMute() -> (volume: Int, isMuted: Bool) {
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        task.arguments = ["-e", "return {output volume of (get volume settings), output muted of (get volume settings)}"]
        
        let pipe = Pipe()
        let errorPipe = Pipe()
        task.standardOutput = pipe
        task.standardError = errorPipe
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) {
                // Output format: "25, false"
                let parts = output.components(separatedBy: ", ")
                if parts.count == 2 {
                    let volume = Int(parts[0]) ?? 0
                    let isMuted = parts[1] == "true"
                    return (volume, isMuted)
                }
            }
        }
    } catch {
        // Silently fail and return defaults
    }
    return (0, false)
}

private func getDefaultDeviceID(selector: AudioObjectPropertySelector) -> AudioDeviceID {
    var deviceID = AudioDeviceID(0)
    var propertySize = UInt32(MemoryLayout.size(ofValue: deviceID))
    var propertyAddress = AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &propertyAddress,
        0,
        nil,
        &propertySize,
        &deviceID
    )
    return deviceID
}

private func getCoreAudioDevices() -> [AudioDevice] {
    var devices: [AudioDevice] = []
    
    let defaultInputID = getDefaultDeviceID(selector: kAudioHardwarePropertyDefaultInputDevice)
    let defaultOutputID = getDefaultDeviceID(selector: kAudioHardwarePropertyDefaultOutputDevice)
    let defaultSystemOutputID = getDefaultDeviceID(selector: kAudioHardwarePropertyDefaultSystemOutputDevice)
    
    var propertySize: UInt32 = 0
    var address = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &propertySize)
    
    let deviceCount = Int(propertySize) / MemoryLayout<AudioDeviceID>.size
    var deviceIDs = [AudioDeviceID](repeating: 0, count: deviceCount)
    
    AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &address, 0, nil, &propertySize, &deviceIDs)
    
    for id in deviceIDs {
        let name = getDeviceStringProperty(id: id, selector: kAudioDevicePropertyDeviceNameCFString)
        let manufacturer = getDeviceStringProperty(id: id, selector: kAudioDevicePropertyDeviceManufacturerCFString)
        let transportType = getDeviceTransportType(id: id)
        
        // Check input/output channels
        let inputChannels = getDeviceBufferFrameSize(id: id, scope: kAudioObjectPropertyScopeInput)
        let outputChannels = getDeviceBufferFrameSize(id: id, scope: kAudioObjectPropertyScopeOutput)
        
        let isInput = inputChannels > 0
        let isOutput = outputChannels > 0
        
        if isInput || isOutput {
            let isDefaultIn = (id == defaultInputID)
            let isDefaultOut = (id == defaultOutputID) || (id == defaultSystemOutputID)
            
            devices.append(AudioDevice(
                name: name,
                manufacturer: manufacturer,
                transport: transportType,
                isInput: isInput,
                isOutput: isOutput,
                isDefaultInput: isDefaultIn,
                isDefaultOutput: isDefaultOut
            ))
        }
    }
    
    return devices
}

private func getDeviceStringProperty(id: AudioDeviceID, selector: AudioObjectPropertySelector) -> String {
    var stringRef: Unmanaged<CFString>?
    var propertySize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
    var address = AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    let status = AudioObjectGetPropertyData(id, &address, 0, nil, &propertySize, &stringRef)
    if status == noErr, let existingString = stringRef?.takeRetainedValue() {
        return existingString as String
    }
    return "Unknown"
}

private func getDeviceTransportType(id: AudioDeviceID) -> String {
    var transportType: UInt32 = 0
    var propertySize = UInt32(MemoryLayout.size(ofValue: transportType))
    var address = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyTransportType,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    let status = AudioObjectGetPropertyData(id, &address, 0, nil, &propertySize, &transportType)
    if status == noErr {
        switch transportType {
        case kAudioDeviceTransportTypeBuiltIn: return "builtin"
        case kAudioDeviceTransportTypeUSB: return "usb"
        case kAudioDeviceTransportTypeBluetooth, kAudioDeviceTransportTypeBluetoothLE: return "bluetooth"
        case kAudioDeviceTransportTypeHDMI: return "hdmi"
        case kAudioDeviceTransportTypeDisplayPort: return "displayport"
        case kAudioDeviceTransportTypeThunderbolt: return "thunderbolt"
        case kAudioDeviceTransportTypeVirtual: return "virtual"
        case kAudioDeviceTransportTypePCI: return "pci"
        case kAudioDeviceTransportTypeFireWire: return "firewire"
        case kAudioDeviceTransportTypeAirPlay: return "airplay"
        default: return "unknown"
        }
    }
    return "unknown"
}

private func getDeviceBufferFrameSize(id: AudioDeviceID, scope: AudioObjectPropertyScope) -> UInt32 {
    var propertySize: UInt32 = 0
    var address = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyStreamConfiguration,
        mScope: scope,
        mElement: kAudioObjectPropertyElementMain
    )
    
    let status = AudioObjectGetPropertyDataSize(id, &address, 0, nil, &propertySize)
    if status == noErr {
        let bufferListSize = Int(propertySize)
        let bufferList = UnsafeMutablePointer<Int8>.allocate(capacity: bufferListSize)
        defer { bufferList.deallocate() }
        
        let status = AudioObjectGetPropertyData(id, &address, 0, nil, &propertySize, bufferList)
        if status == noErr {
            // Need to correctly parse AudioBufferList to count channels. 
            // For simplicity in this context, detecting presence of streams via Size > 0 is often enough to indicate capability
            // But strict check: UnsafeRawPointer(bufferList).bindMemory(to: AudioBufferList.self, capacity: 1).pointee
            // A simpler way to check if device supports input/output is checking kAudioDevicePropertyStreams
             
             var streamSize: UInt32 = 0
             var streamAddress = AudioObjectPropertyAddress(
                mSelector: kAudioDevicePropertyStreams,
                mScope: scope,
                mElement: kAudioObjectPropertyElementMain
             )
             AudioObjectGetPropertyDataSize(id, &streamAddress, 0, nil, &streamSize)
             return streamSize // >0 means has streams
        }
    }
    return 0
}
