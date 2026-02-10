import Foundation
import CoreAudio
import AVFoundation
import AppKit

private func logAudioDebug(_ message: String) {
    let env = ProcessInfo.processInfo.environment["SCRIBE_AUDIO_DEBUG"] ?? ""
    if env == "1" || env.lowercased() == "true" {
        let line = "[scribe audio] \(message)\n"
        if let data = line.data(using: .utf8) {
            FileHandle.standardError.write(data)
        }
    }
}

public struct PlayingAudioInfo {
    public let appName: String
    public let title: String?
    public let artist: String?
    public let album: String?
    public let duration: Double?
    public let currentTime: Double?
    public let isPlaying: Bool
    public let playbackRate: Double?
    public let volume: Double?
    public let genre: String?
    public let year: Int?
    public let trackNumber: Int?
    public let albumArtist: String?
    public let composer: String?
    public let rating: Int?
    public let playCount: Int?
    public let artworkURL: String?
}

public struct AudioDeviceDetails {
    public let name: String
    public let sampleRate: Double?
    public let bitDepth: Int?
    public let channels: Int?
    public let bufferSize: Int?
}

public struct AudioPlaybackData {
    public let hasActiveAudio: Bool
    public let activeAudioCount: Int
    public let playingApps: [String]
    public let nowPlaying: [PlayingAudioInfo]
    public let systemAudioActive: Bool
    public let outputDevice: AudioDeviceDetails?
    public let audioLevels: (left: Double, right: Double)?
}

public func getAudioPlaybackData() -> AudioPlaybackData {
    var playingApps: [String] = []
    var nowPlaying: [PlayingAudioInfo] = []
    var hasActiveAudio = false
    var systemAudioActive = false
    
    systemAudioActive = isSystemAudioActive()
    
    let mediaInfo = getCurrentMediaInfo()
    if let info = mediaInfo {
        nowPlaying.append(info)
        playingApps.append(info.appName)
        hasActiveAudio = info.isPlaying
    }
    
    let runningAudioApps = getRunningAudioApps()
    for app in runningAudioApps {
        if !playingApps.contains(app) {
            playingApps.append(app)
        }
    }
    
    if systemAudioActive && !hasActiveAudio {
        hasActiveAudio = true
    }
    
    let outputDevice = getCurrentOutputDeviceDetails()
    
    let audioLevels = getCurrentAudioLevels()
    
    return AudioPlaybackData(
        hasActiveAudio: hasActiveAudio,
        activeAudioCount: playingApps.count,
        playingApps: playingApps,
        nowPlaying: nowPlaying,
        systemAudioActive: systemAudioActive,
        outputDevice: outputDevice,
        audioLevels: audioLevels
    )
}

private func isSystemAudioActive() -> Bool {
    var propertyAddress = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDefaultOutputDevice,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    var deviceID = AudioDeviceID(0)
    var propertySize = UInt32(MemoryLayout.size(ofValue: deviceID))
    
    let status = AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &propertyAddress,
        0,
        nil,
        &propertySize,
        &deviceID
    )
    
    if status != noErr || deviceID == 0 {
        return false
    }
    
    var isRunning: UInt32 = 0
    propertySize = UInt32(MemoryLayout.size(ofValue: isRunning))
    propertyAddress.mSelector = kAudioDevicePropertyDeviceIsRunningSomewhere
    propertyAddress.mScope = kAudioObjectPropertyScopeGlobal
    
    let runningStatus = AudioObjectGetPropertyData(
        deviceID,
        &propertyAddress,
        0,
        nil,
        &propertySize,
        &isRunning
    )
    
    return runningStatus == noErr && isRunning != 0
}

private func getCurrentMediaInfo() -> PlayingAudioInfo? {
    if let musicInfo = getMediaInfoFromApp(appName: "Music") {
        return musicInfo
    }
    
    if let spotifyInfo = getMediaInfoFromApp(appName: "Spotify") {
        return spotifyInfo
    }
    
    let mediaApps = ["VLC", "QuickTime Player", "YouTube Music", "Apple TV", "Tidal"]
    for app in mediaApps {
        if let info = getMediaInfoFromApp(appName: app) {
            return info
        }
    }
    
    // Browsers (YouTube, etc.): no track metadata via AppleScript, but we can report app as source when running
    let browserApps = ["Google Chrome", "Chrome", "Safari", "Firefox", "Arc"]
    for app in browserApps {
        if let info = getMediaInfoFromApp(appName: app) {
            return info
        }
    }
    
    return nil
}

private func getMediaInfoFromApp(appName: String) -> PlayingAudioInfo? {
    let script: String
    
    switch appName {
    case "Music":
        script = """
        tell application "System Events"
            if exists process "Music" then
                tell application "Music"
                    if player state is playing then
                        set trackName to name of current track
                        set trackArtist to artist of current track
                        set trackAlbum to album of current track
                        set trackDuration to duration of current track
                        set trackPosition to player position
                        set trackVolume to sound volume
                        
                        try
                            set trackGenre to genre of current track
                        on error
                            set trackGenre to ""
                        end try
                        
                        try
                            set trackYear to year of current track
                        on error
                            set trackYear to 0
                        end try
                        
                        try
                            set trackNumber to track number of current track
                        on error
                            set trackNumber to 0
                        end try
                        
                        try
                            set trackAlbumArtist to album artist of current track
                        on error
                            set trackAlbumArtist to ""
                        end try
                        
                        try
                            set trackComposer to composer of current track
                        on error
                            set trackComposer to ""
                        end try
                        
                        try
                            set trackRating to rating of current track
                        on error
                            set trackRating to 0
                        end try
                        
                        try
                            set trackPlayCount to played count of current track
                        on error
                            set trackPlayCount to 0
                        end try
                        
                        return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & trackDuration & "|||" & trackPosition & "|||" & trackVolume & "|||playing|||" & trackGenre & "|||" & trackYear & "|||" & trackNumber & "|||" & trackAlbumArtist & "|||" & trackComposer & "|||" & trackRating & "|||" & trackPlayCount
                    end if
                end tell
            end if
        end tell
        return ""
        """
    case "Spotify":
        script = """
        tell application "System Events"
            if exists process "Spotify" then
                tell application "Spotify"
                    if player state is playing then
                        set trackName to name of current track
                        set trackArtist to artist of current track
                        set trackAlbum to album of current track
                        set trackDuration to duration of current track
                        set trackPosition to player position
                        set trackVolume to sound volume
                        
                        try
                            set trackArtwork to artwork url of current track
                        on error
                            set trackArtwork to ""
                        end try
                        
                        return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & trackDuration & "|||" & trackPosition & "|||" & trackVolume & "|||playing|||" & trackArtwork
                    end if
                end tell
            end if
        end tell
        return ""
        """
    case "Google Chrome", "Chrome":
        script = """
        tell application "Google Chrome"
            if (count of windows) > 0 then
                try
                    -- First scan ALL tabs in ALL windows for media sites (YouTube, etc.)
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (title of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
                    -- Fallback: return the active tab
                    set tabURL to URL of active tab of first window
                    set tabTitle to title of active tab of first window
                    return tabTitle & "|||" & tabURL
                on error errMsg
                    return ""
                end try
            end if
        end tell
        return ""
        """
    case "Safari":
        script = """
        tell application "Safari"
            if (count of windows) > 0 then
                try
                    -- First scan ALL tabs in ALL windows for media sites
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (name of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
                    -- Fallback: return the current tab
                    set tabURL to URL of current tab of first window
                    set tabTitle to name of current tab of first window
                    return tabTitle & "|||" & tabURL
                on error errMsg
                    return ""
                end try
            end if
        end tell
        return ""
        """
    case "Arc":
        script = """
        tell application "Arc"
            if (count of windows) > 0 then
                try
                    -- First scan ALL tabs in ALL windows for media sites
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (title of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
                    -- Fallback: return the active tab
                    set tabURL to URL of active tab of first window
                    set tabTitle to title of active tab of first window
                    return tabTitle & "|||" & tabURL
                on error errMsg
                    return ""
                end try
            end if
        end tell
        return ""
        """
    default:
        script = """
        tell application "System Events"
            if exists process "\(appName)" then
                return "playing"
            end if
        end tell
        return ""
        """
    }
    
    do {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        task.arguments = ["-e", script]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = Pipe()
        task.standardInput = FileHandle.nullDevice
        
        try task.run()
        task.waitUntilExit()
        
        if task.terminationStatus == 0 {
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            if let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !output.isEmpty {
                let parts = output.components(separatedBy: "|||")
                
                // Browser tab title + URL (Chrome, Safari, Arc): "title|||url"
                let browserAppsWithTabInfo = ["Google Chrome", "Chrome", "Safari", "Arc"]
                if browserAppsWithTabInfo.contains(appName), parts.count >= 2 {
                    let rawTitle = parts[0]
                    let rawURL = parts[1]
                    logAudioDebug("AudioPlayback [\(appName)] raw title: \(rawTitle.prefix(200))")
                    logAudioDebug("AudioPlayback [\(appName)] raw url: \(rawURL.prefix(200))")
                    let urlLower = rawURL.lowercased()
                    var title: String? = rawTitle.isEmpty ? nil : rawTitle
                    var artist: String? = nil
                    
                    // Detect media site from URL and parse title
                    if urlLower.contains("youtube.com") || urlLower.contains("youtu.be") {
                        if let t = title {
                            let cleaned = t.replacingOccurrences(of: " - YouTube", with: "").trimmingCharacters(in: .whitespaces)
                            title = cleaned.isEmpty ? nil : cleaned
                        }
                        artist = "YouTube"
                    } else if urlLower.contains("netflix.com") {
                        artist = "Netflix"
                    } else if urlLower.contains("twitch.tv") {
                        if let t = title {
                            let cleaned = t.replacingOccurrences(of: " - Twitch", with: "").trimmingCharacters(in: .whitespaces)
                            title = cleaned.isEmpty ? nil : cleaned
                        }
                        artist = "Twitch"
                    } else if urlLower.contains("soundcloud.com") {
                        artist = "SoundCloud"
                    } else if urlLower.contains("open.spotify.com") {
                        artist = "Spotify Web"
                    }
                    
                    logAudioDebug("AudioPlayback [\(appName)] parsed → title=\(title ?? "nil") artist=\(artist ?? "nil") url=\(rawURL.prefix(80))")
                    return PlayingAudioInfo(
                        appName: appName,
                        title: title,
                        artist: artist,
                        album: nil,
                        duration: nil,
                        currentTime: nil,
                        isPlaying: true,
                        playbackRate: nil,
                        volume: nil,
                        genre: nil,
                        year: nil,
                        trackNumber: nil,
                        albumArtist: nil,
                        composer: nil,
                        rating: nil,
                        playCount: nil,
                        artworkURL: nil
                    )
                }
                
                if parts.count >= 14 && appName == "Music" {
                    return PlayingAudioInfo(
                        appName: appName,
                        title: parts[0].isEmpty ? nil : parts[0],
                        artist: parts[1].isEmpty ? nil : parts[1],
                        album: parts[2].isEmpty ? nil : parts[2],
                        duration: Double(parts[3]),
                        currentTime: Double(parts[4]),
                        isPlaying: parts[6] == "playing",
                        playbackRate: 1.0,
                        volume: Double(parts[5]),
                        genre: parts[7].isEmpty ? nil : parts[7],
                        year: Int(parts[8]) ?? nil,
                        trackNumber: Int(parts[9]) ?? nil,
                        albumArtist: parts[10].isEmpty ? nil : parts[10],
                        composer: parts[11].isEmpty ? nil : parts[11],
                        rating: Int(parts[12]) ?? nil,
                        playCount: Int(parts[13]) ?? nil,
                        artworkURL: nil
                    )
                } else if parts.count >= 8 && appName == "Spotify" {
                    return PlayingAudioInfo(
                        appName: appName,
                        title: parts[0].isEmpty ? nil : parts[0],
                        artist: parts[1].isEmpty ? nil : parts[1],
                        album: parts[2].isEmpty ? nil : parts[2],
                        duration: Double(parts[3]),
                        currentTime: Double(parts[4]),
                        isPlaying: parts[6] == "playing",
                        playbackRate: 1.0,
                        volume: Double(parts[5]),
                        genre: nil,
                        year: nil,
                        trackNumber: nil,
                        albumArtist: nil,
                        composer: nil,
                        rating: nil,
                        playCount: nil,
                        artworkURL: parts[7].isEmpty ? nil : parts[7]
                    )
                } else if parts.count >= 7 {
                    return PlayingAudioInfo(
                        appName: appName,
                        title: parts[0].isEmpty ? nil : parts[0],
                        artist: parts[1].isEmpty ? nil : parts[1],
                        album: parts[2].isEmpty ? nil : parts[2],
                        duration: Double(parts[3]),
                        currentTime: Double(parts[4]),
                        isPlaying: parts[6] == "playing",
                        playbackRate: 1.0,
                        volume: Double(parts[5]),
                        genre: nil,
                        year: nil,
                        trackNumber: nil,
                        albumArtist: nil,
                        composer: nil,
                        rating: nil,
                        playCount: nil,
                        artworkURL: nil
                    )
                } else if output == "playing" {
                    return PlayingAudioInfo(
                        appName: appName,
                        title: nil,
                        artist: nil,
                        album: nil,
                        duration: nil,
                        currentTime: nil,
                        isPlaying: true,
                        playbackRate: nil,
                        volume: nil,
                        genre: nil,
                        year: nil,
                        trackNumber: nil,
                        albumArtist: nil,
                        composer: nil,
                        rating: nil,
                        playCount: nil,
                        artworkURL: nil
                    )
                }
            }
        }
    } catch {
    }
    
    return nil
}

private func getCurrentOutputDeviceDetails() -> AudioDeviceDetails? {
    var propertyAddress = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDefaultOutputDevice,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    
    var deviceID = AudioDeviceID(0)
    var propertySize = UInt32(MemoryLayout.size(ofValue: deviceID))
    
    let status = AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &propertyAddress,
        0,
        nil,
        &propertySize,
        &deviceID
    )
    
    if status != noErr || deviceID == 0 {
        return nil
    }
    
    var deviceName: Unmanaged<CFString>?
    propertySize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
    propertyAddress.mSelector = kAudioDevicePropertyDeviceNameCFString
    
    AudioObjectGetPropertyData(deviceID, &propertyAddress, 0, nil, &propertySize, &deviceName)
    let name = deviceName?.takeRetainedValue() as String? ?? "Unknown"
    
    var sampleRate: Float64 = 0
    propertySize = UInt32(MemoryLayout.size(ofValue: sampleRate))
    propertyAddress.mSelector = kAudioDevicePropertyNominalSampleRate
    
    AudioObjectGetPropertyData(deviceID, &propertyAddress, 0, nil, &propertySize, &sampleRate)
    
    var bufferSize: UInt32 = 0
    propertySize = UInt32(MemoryLayout.size(ofValue: bufferSize))
    propertyAddress.mSelector = kAudioDevicePropertyBufferFrameSize
    
    AudioObjectGetPropertyData(deviceID, &propertyAddress, 0, nil, &propertySize, &bufferSize)
    
    propertyAddress.mSelector = kAudioDevicePropertyStreamConfiguration
    propertyAddress.mScope = kAudioObjectPropertyScopeOutput
    propertySize = 0
    
    AudioObjectGetPropertyDataSize(deviceID, &propertyAddress, 0, nil, &propertySize)
    
    var channels = 0
    if propertySize > 0 {
        let bufferList = UnsafeMutablePointer<Int8>.allocate(capacity: Int(propertySize))
        defer { bufferList.deallocate() }
        
        if AudioObjectGetPropertyData(deviceID, &propertyAddress, 0, nil, &propertySize, bufferList) == noErr {
            let audioBufferList = UnsafeMutableAudioBufferListPointer(UnsafeMutablePointer<AudioBufferList>(OpaquePointer(bufferList)))
            for buffer in audioBufferList {
                channels += Int(buffer.mNumberChannels)
            }
        }
    }
    
    return AudioDeviceDetails(
        name: name,
        sampleRate: sampleRate > 0 ? sampleRate : nil,
        bitDepth: nil,
        channels: channels > 0 ? channels : nil,
        bufferSize: bufferSize > 0 ? Int(bufferSize) : nil
    )
}

private func getCurrentAudioLevels() -> (left: Double, right: Double)? {
    return nil
}

private func getRunningAudioApps() -> [String] {
    let audioApps = [
        "Music", "Spotify", "VLC", "QuickTime Player", "iTunes",
        "YouTube Music", "Apple TV", "Netflix",
        "Podcasts", "Overcast", "Pocket Casts", "SoundCloud",
        "Tidal", "Apple Music", "Amazon Music", "Deezer",
        "Google Chrome", "Chrome", "Safari", "Firefox", "Arc"
    ]
    
    var runningAudioApps: [String] = []
    
    let workspace = NSWorkspace.shared
    let runningApps = workspace.runningApplications
    
    for app in runningApps {
        if let appName = app.localizedName {
            if audioApps.contains(appName) {
                runningAudioApps.append(appName)
            }
        }
    }
    
    return runningAudioApps
}
