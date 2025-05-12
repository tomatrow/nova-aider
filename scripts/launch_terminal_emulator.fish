#! /usr/bin/env fish


argparse --name launch_terminal_emulator 't/terminal=' 'c/command=' -- $argv
or exit

switch $_flag_terminal
	case ghostty
		echo "
		tell application \"Ghostty\"
			if it is running then
				activate
				tell application \"System Events\" to keystroke \"t\" using {command down}
			else 
				activate
			end if
		
			tell application \"System Events\"
				delay 0.1
				keystroke \"$_flag_command\"
				keystroke return
			end tell
		end tell
		"
	case prompt
		echo "
		tell application \"Prompt\"
			if it is running then
				activate
				tell application \"System Events\" to keystroke \"t\" using {command down}
			else 
				activate
			end if
		
			tell application \"System Events\"
				delay 0.1
				keystroke \"$_flag_command\"
				keystroke return
			end tell
		end tell
		"
	case '*'
		exit 1
end | osascript

