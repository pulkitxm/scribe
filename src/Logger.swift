import Foundation

public class Logger {
    public static let shared = Logger()
    var fileHandle: FileHandle?
    
    private init() {
        let currentDir = FileManager.default.currentDirectoryPath
        let logsDir = URL(fileURLWithPath: currentDir).appendingPathComponent("logs")
        let logFile = logsDir.appendingPathComponent("app.log")
        
        do {
            try FileManager.default.createDirectory(at: logsDir, withIntermediateDirectories: true)
            if !FileManager.default.fileExists(atPath: logFile.path) {
                FileManager.default.createFile(atPath: logFile.path, contents: nil)
            }
            fileHandle = try FileHandle(forWritingTo: logFile)
            fileHandle?.seekToEndOfFile()
        } catch {
            print("Failed to setup logger: \(error)")
        }
    }
    
    func log(_ message: String) {
        // Console output
        print(message)
        
        // File output
        let timestamp = DateFormatter()
        timestamp.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let logEntry = "[\(timestamp.string(from: Date()))] \(message)\n"
        
        if let data = logEntry.data(using: .utf8) {
            fileHandle?.write(data)
        }
    }
}

// Extension to help writing data
extension FileHandle {
    func trace(_ data: Data) {
        self.seekToEndOfFile()
        self.write(data)
    }
}
