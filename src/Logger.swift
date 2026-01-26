import Foundation

public class Logger {
    public static let shared = Logger()
    var fileHandle: FileHandle?
    
    private init() {
        if let libraryDir = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
            let logsDir = libraryDir.appendingPathComponent("Logs").appendingPathComponent("com.scribe.service")
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
    }
    
    func log(_ message: String) {
        print(message)
        
        let timestamp = DateFormatter()
        timestamp.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let logEntry = "[\(timestamp.string(from: Date()))] \(message)\n"
        
        if let data = logEntry.data(using: .utf8) {
            fileHandle?.write(data)
        }
    }
}

extension FileHandle {
    func trace(_ data: Data) {
        self.seekToEndOfFile()
        self.write(data)
    }
}
