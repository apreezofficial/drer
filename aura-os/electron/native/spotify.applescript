on run argv
    set requestedAction to item 1 of argv
    tell application "Spotify"
        if requestedAction is "play" then
            play
        else if requestedAction is "pause" then
            pause
        else if requestedAction is "next" then
            next track
        else if requestedAction is "previous" then
            previous track
        else
            error "Unsupported playback action."
        end if
        delay 1
        return player state as string
    end tell
end run
