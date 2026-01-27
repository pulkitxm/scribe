import Foundation
import AVFoundation

public struct VideoDevice {
    public let name: String
    public let manufacturer: String
    public let uniqueID: String
    public let isConnected: Bool
    public let isSuspended: Bool
}

public func getVideoDevices() -> [VideoDevice] {
    var devices: [VideoDevice] = []
    
    // Discover video devices (cameras)
    // We target built-in wide angle camera (common webcams) and external devices
    let discoverySession = AVCaptureDevice.DiscoverySession(
        deviceTypes: [.builtInWideAngleCamera, .external],
        mediaType: .video,
        position: .unspecified
    )
    
    for device in discoverySession.devices {
        devices.append(VideoDevice(
            name: device.localizedName,
            manufacturer: device.manufacturer,
            uniqueID: device.uniqueID,
            isConnected: device.isConnected,
            isSuspended: device.isSuspended
        ))
    }
    
    return devices
}
