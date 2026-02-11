import Foundation
import CoreAudio
import AVFoundation
import AppKit

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
}

public struct AudioPlaybackData {
    public let hasActiveAudio: Bool
    public let activeAudioCount: Int
    public let playingApps: [String]
    public let nowPlaying: [PlayingAudioInfo]
    public let systemAudioActive: Bool
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
    
    return AudioPlaybackData(
        hasActiveAudio: hasActiveAudio,
        activeAudioCount: playingApps.count,
        playingApps: playingApps,
        nowPlaying: nowPlaying,
        systemAudioActive: systemAudioActive
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
    let browserApps = ["Google Chrome", "Chrome", "Safari", "Arc"]
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
                        return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & trackDuration & "|||" & trackPosition & "|||" & trackVolume & "|||playing"
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
                        return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & trackDuration & "|||" & trackPosition & "|||" & trackVolume & "|||playing"
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
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (title of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
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
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (name of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
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
                    repeat with w in windows
                        repeat with t in tabs of w
                            set tURL to URL of t
                            if tURL contains "youtube.com/watch" or tURL contains "youtu.be/" or tURL contains "music.youtube.com" or tURL contains "netflix.com/watch" or tURL contains "twitch.tv/" or tURL contains "soundcloud.com" or tURL contains "open.spotify.com" then
                                return (title of t) & "|||" & tURL
                            end if
                        end repeat
                    end repeat
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
                
                let browserAppsWithTabInfo = ["Google Chrome", "Chrome", "Safari", "Arc"]
                if browserAppsWithTabInfo.contains(appName), parts.count >= 2 {
                    let rawTitle = String(parts[0].prefix(200))
                    let rawURL = String(parts[1].prefix(150))
                    fputs("[test-audio] \(appName) raw title: \(rawTitle)\n", stderr)
                    fputs("[test-audio] \(appName) raw url: \(rawURL)\n", stderr)
                    let urlLower = rawURL.lowercased()
                    var title: String? = parts[0].isEmpty ? nil : parts[0]
                    var artist: String? = nil
                    
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
                    
                    fputs("[test-audio] \(appName) parsed → title=\(title ?? "nil") artist=\(artist ?? "nil") url=\(rawURL)\n", stderr)
                    return PlayingAudioInfo(
                        appName: appName,
                        title: title,
                        artist: artist,
                        album: nil,
                        duration: nil,
                        currentTime: nil,
                        isPlaying: true,
                        playbackRate: nil,
                        volume: nil
                    )
                }
                
                if parts.count >= 7 {
                    return PlayingAudioInfo(
                        appName: appName,
                        title: parts[0],
                        artist: parts[1],
                        album: parts[2],
                        duration: Double(parts[3]),
                        currentTime: Double(parts[4]),
                        isPlaying: parts[6] == "playing",
                        playbackRate: 1.0,
                        volume: Double(parts[5])
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
                        volume: nil
                    )
                }
            }
        }
    } catch {}
    
    return nil
}

private func getRunningAudioApps() -> [String] {
    let audioApps = [
        "Music", "Spotify", "VLC", "QuickTime Player", "iTunes",
        "Safari", "Google Chrome", "Firefox", "Arc", "Brave Browser",
        "YouTube Music", "Apple TV", "Netflix", "Discord", "Slack",
        "Zoom", "Microsoft Teams", "FaceTime", "Skype",
        "Podcasts", "Overcast", "Pocket Casts", "SoundCloud"
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

print("🎵 Audio Playback Detection Test")
print("================================\n")

let audioData = getAudioPlaybackData()

print("System Audio Active: \(audioData.systemAudioActive ? "✅ Yes" : "❌ No")")
print("Has Active Audio: \(audioData.hasActiveAudio ? "✅ Yes" : "❌ No")")
print("Active Audio Count: \(audioData.activeAudioCount)")
print("\nRunning Audio Apps:")
if audioData.playingApps.isEmpty {
    print("  None detected")
} else {
    for app in audioData.playingApps {
        print("  • \(app)")
    }
}

print("\nNow Playing:")
if audioData.nowPlaying.isEmpty {
    print("  No media info available")
} else {
    for info in audioData.nowPlaying {
        print("  App: \(info.appName)")
        if let title = info.title {
            print("  Title: \(title)")
        }
        if let artist = info.artist {
            print("  Artist: \(artist)")
        }
        if let album = info.album {
            print("  Album: \(album)")
        }
        if let duration = info.duration, let currentTime = info.currentTime {
            let durationMin = Int(duration) / 60
            let durationSec = Int(duration) % 60
            let currentMin = Int(currentTime) / 60
            let currentSec = Int(currentTime) % 60
            print("  Progress: \(currentMin):\(String(format: "%02d", currentSec)) / \(durationMin):\(String(format: "%02d", durationSec))")
        }
        print("  Playing: \(info.isPlaying ? "▶️ Yes" : "⏸️ No")")
        print("")
    }
}

var playback: [String: Any] = [
    "has_active_audio": audioData.hasActiveAudio,
    "active_audio_count": audioData.activeAudioCount,
    "system_audio_active": audioData.systemAudioActive,
    "playing_apps": audioData.playingApps,
    "now_playing": audioData.nowPlaying.map { info -> [String: Any] in
        let track: [String: Any] = [
            "app": info.appName,
            "title": info.title ?? "",
            "artist": info.artist ?? "",
            "album": info.album ?? "",
            "duration": info.duration ?? 0,
            "current_time": info.currentTime ?? 0,
            "is_playing": info.isPlaying,
            "playback_rate": info.playbackRate ?? 1.0,
            "volume": info.volume ?? 0
        ]
        return track
    }
]
playback["output_device"] = NSNull()

if let data = try? JSONSerialization.data(withJSONObject: ["playback": playback], options: .prettyPrinted),
   let json = String(data: data, encoding: .utf8) {
    print("\n--- Exact JSON ---\n")
    print(json)
}

print("\n================================")
print("✅ Audio detection test complete!")
