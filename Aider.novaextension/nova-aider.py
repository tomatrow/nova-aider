from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main
from watchfiles import watch
import threading
import json
import os

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

def handle_messages_file():
    global messages_file_last_modified
    try:
        if not os.path.exists(MESSAGE_INPUT_FILE_PATH):
            return

        current_modified = os.path.getmtime(MESSAGE_INPUT_FILE_PATH)
        if current_modified <= messages_file_last_modified:
            return
        messages_file_last_modified = current_modified

        with open(MESSAGE_INPUT_FILE_PATH, 'r') as f:
            content = f.read().strip()
        if not content:
            return

        messages = json.loads(content)
        coder.io.interrupt_input()
        run_messages(messages)
    except Exception as e:
        print(f"Error handling messages file {e}")
    finally:
        try:
            with open(MESSAGE_INPUT_FILE_PATH, 'w') as f:
                pass
        except Exception as e:
            print(f"Error clearing messages file {e}")

def watch_messages_file():
    os.makedirs(CACHE_DIR, exist_ok=True)

    handle_messages_file()
    for _ in watch(MESSAGE_INPUT_FILE_PATH):
        handle_messages_file()

def begin():
    global watcher_thread
    watcher_thread = threading.Thread(target=watch_messages_file, daemon=True)
    watcher_thread.start()

    while True:
        message = coder.get_input()
        run_messages([message])

begin()
