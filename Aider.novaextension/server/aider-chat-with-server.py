from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main
import threading
import json
import os
import time

CACHE_DIR = '.aider.nova.cache.v1'
MESSAGE_INPUT_FILE_PATH = os.path.join(CACHE_DIR, "messages.json")
CODER_STATE_FILE_PATH = os.path.join(CACHE_DIR, "coder.json")

coder = main(return_coder=True)
messages_file_last_modified = 0
watcher_thread = None

def run_messages(messages):
    global coder
    for message in messages:
        try:
            coder.run_one(message, True)
        except SwitchCoder as switch:
            io = coder.io
            kwargs = dict(io=io, from_coder=coder)
            kwargs.update(switch.kwargs)
            coder = Coder.create(**kwargs)
    os.makedirs(CACHE_DIR, exist_ok=True)
    coder_state = { 
        "abs_fnames": list(coder.abs_fnames),
        "abs_read_only_fnames": list(coder.abs_read_only_fnames)
    }
    with open(CODER_STATE_FILE_PATH, 'w') as f:
        json.dump(coder_state, f, indent=2)

def watch_messages_file():
    global messages_file_last_modified
    while True:
        try:
            if not os.path.exists(MESSAGE_INPUT_FILE_PATH):
                continue

            current_modified = os.path.getmtime(MESSAGE_INPUT_FILE_PATH)
            if current_modified <= messages_file_last_modified:
                continue
            messages_file_last_modified = current_modified

            with open(MESSAGE_INPUT_FILE_PATH, 'r') as f:
                content = f.read().strip()
            if not content:
                continue

            messages = json.loads(content)
            open(MESSAGE_INPUT_FILE_PATH, 'w').close()
            coder.io.interrupt_input()
            run_messages(messages)
        except Exception:
            pass
        time.sleep(0.05) # 50ms

def main():
    global watcher_thread
    watcher_thread = threading.Thread(target=watch_messages_file, daemon=True)
    watcher_thread.start()

    while True:
        message = coder.get_input()
        run_messages([message])

main()
