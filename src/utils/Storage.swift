import Foundation

public struct StorageInfo {
    public let total: UInt64
    public let used: UInt64
    public let free: UInt64
}

public func getStorageUsage() -> StorageInfo {
    let fileURL = URL(fileURLWithPath: "/")
    do {
        let values = try fileURL.resourceValues(forKeys: [.volumeTotalCapacityKey, .volumeAvailableCapacityForImportantUsageKey])
        let total = UInt64(values.volumeTotalCapacity ?? 0)
        let free = UInt64(values.volumeAvailableCapacityForImportantUsage ?? 0)
        let used = total > free ? total - free : 0
        return StorageInfo(total: total, used: used, free: free)
    } catch {
        return StorageInfo(total: 0, used: 0, free: 0)
    }
}
