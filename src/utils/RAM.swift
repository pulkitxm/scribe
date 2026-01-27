import Foundation

public struct RAMInfo {
    public let total: UInt64
    public let used: UInt64
    public let free: UInt64
}

public func getRAMUsage() -> RAMInfo {
    let totalRAM = ProcessInfo.processInfo.physicalMemory
    
    var stats = vm_statistics64()
    var count = mach_msg_type_number_t(MemoryLayout<vm_statistics64>.size / MemoryLayout<integer_t>.size)
    let hostPort = mach_host_self()
    
    let result = withUnsafeMutablePointer(to: &stats) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
            host_statistics64(hostPort, HOST_VM_INFO64, $0, &count)
        }
    }
    
    if result == KERN_SUCCESS {
        let pageSize = UInt64(vm_kernel_page_size)
        let freeRAM = UInt64(stats.free_count) * pageSize
        let activeRAM = UInt64(stats.active_count) * pageSize
        let inactiveRAM = UInt64(stats.inactive_count) * pageSize
        let wiredRAM = UInt64(stats.wire_count) * pageSize
        let compressedRAM = UInt64(stats.compressor_page_count) * pageSize
        
        let usedRAM = activeRAM + wiredRAM + compressedRAM
        let actualFree = freeRAM + inactiveRAM
        
        return RAMInfo(total: totalRAM, used: usedRAM, free: actualFree)
    }
    
    return RAMInfo(total: totalRAM, used: 0, free: totalRAM)
}
