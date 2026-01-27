import Foundation
import AppKit

public func getActiveAppName() -> String {
    if let frontmostApp = NSWorkspace.shared.frontmostApplication {
        return frontmostApp.localizedName ?? "Unknown"
    }
    return "Unknown"
}

public func getOpenedApps() -> [String] {
    let runningApps = NSWorkspace.shared.runningApplications
    return runningApps.filter { $0.activationPolicy == .regular }
                      .compactMap { $0.localizedName }
                      .sorted()
}
