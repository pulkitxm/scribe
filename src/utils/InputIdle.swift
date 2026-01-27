import Foundation

public struct InputIdleInfo {
    public let idleSeconds: Double
}

public func getInputIdleInfo() -> InputIdleInfo {
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
                    let idleSeconds = Double(idleTimeNanoseconds) / 1_000_000_000.0
                    return InputIdleInfo(idleSeconds: idleSeconds)
                }
            }
            IOObjectRelease(entry)
        }
        IOObjectRelease(iterator)
    }
    return InputIdleInfo(idleSeconds: 0)
}
