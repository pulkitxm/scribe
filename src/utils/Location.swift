import Foundation
import CoreLocation

struct LocationResult {
    let latitude: Double
    let longitude: Double
    var name: String?
}

func getCurrentLocation(timeoutSeconds: TimeInterval = 8.0) -> LocationResult? {
    let manager = CLLocationManager()
    let status = manager.authorizationStatus
    if status == .denied || status == .restricted {
        return getLocationViaShortcuts()
    }

    var result: LocationResult?
    let lock = NSLock()
    var done = false

    let delegate = LocationDelegate(
        onLocation: { loc in
            lock.lock()
            if !done {
                done = true
                result = LocationResult(latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude, name: nil)
            }
            lock.unlock()
        },
        onDone: {
            lock.lock()
            done = true
            lock.unlock()
        }
    )

    manager.delegate = delegate
    manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    #if os(macOS)
    if manager.authorizationStatus == .notDetermined {
        manager.requestAlwaysAuthorization()
    }
    #else
    if manager.authorizationStatus == .notDetermined {
        manager.requestWhenInUseAuthorization()
    }
    #endif
    var authWait = 0.0
    while authWait < 2.0 && manager.authorizationStatus == .notDetermined {
        RunLoop.main.run(until: Date().addingTimeInterval(0.1))
        authWait += 0.1
    }
    if manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted {
        return getLocationViaShortcuts()
    }
    manager.requestLocation()

    let deadline = Date().addingTimeInterval(timeoutSeconds)
    while Date() < deadline {
        lock.lock()
        let finished = done
        lock.unlock()
        if finished { break }
        RunLoop.main.run(until: Date().addingTimeInterval(0.1))
    }

    if result == nil {
        return getLocationViaShortcuts()
    }
    return result
}

private func getLocationViaShortcuts() -> LocationResult? {
    let names = ["getCoreLocationData", "GetLocation", "Get Current Location"]
    for name in names {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/shortcuts")
        process.arguments = ["run", name]
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = FileHandle.nullDevice
        do {
            try process.run()
            process.waitUntilExit()
            guard process.terminationStatus == 0 else { continue }
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let latVal = json["latitude"],
                  let lonVal = json["longitude"] else { continue }
            let lat: Double
            let lon: Double
            if let n = latVal as? Double { lat = n }
            else if let s = latVal as? String, let n = Double(s) { lat = n }
            else { continue }
            if let n = lonVal as? Double { lon = n }
            else if let s = lonVal as? String, let n = Double(s) { lon = n }
            else { continue }
            let placeName = (json["address"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            return LocationResult(latitude: lat, longitude: lon, name: placeName?.isEmpty == false ? placeName : nil)
        } catch {
            continue
        }
    }
    return nil
}

private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    private let onLocation: (CLLocation) -> Void
    private let onDone: () -> Void

    init(onLocation: @escaping (CLLocation) -> Void, onDone: @escaping () -> Void) {
        self.onLocation = onLocation
        self.onDone = onDone
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let loc = locations.last {
            onLocation(loc)
        }
        onDone()
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        onDone()
    }
}
