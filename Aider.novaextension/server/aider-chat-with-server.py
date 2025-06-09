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

class AiderServer:
    def __init__(self):
        self.coder = main(return_coder=True)
        self.last_modified = 0
        self.watcher_thread = None

    def get_coder_state(self):
        return { 
            "abs_fnames": list(self.coder.abs_fnames),
            "abs_read_only_fnames": list(self.coder.abs_read_only_fnames)
        }

    def run(self, messages):
        for message in messages:
            try:
                self.coder.run_one(message, True)
            except SwitchCoder as switch:
                io = self.coder.io
                kwargs = dict(io=io, from_coder=self.coder)
                kwargs.update(switch.kwargs)
                self.coder = Coder.create(**kwargs)
        os.makedirs(CACHE_DIR, exist_ok=True)
        coder_state = self.get_coder_state()
        with open(CODER_STATE_FILE_PATH, 'w') as f:
            json.dump(coder_state, f, indent=2)

    def watch_message_file(self):
        while True:
            try:
                if not os.path.exists(MESSAGE_INPUT_FILE_PATH):
                    continue

                current_modified = os.path.getmtime(MESSAGE_INPUT_FILE_PATH)
                if current_modified <= self.last_modified:
                    continue
                self.last_modified = current_modified

                with open(MESSAGE_INPUT_FILE_PATH, 'r') as f:
                    content = f.read().strip()
                if not content:
                    continue

                messages = json.loads(content)
                open(MESSAGE_INPUT_FILE_PATH, 'w').close()
                self.coder.io.interrupt_input()
                self.run(messages)
            except Exception:
                pass
            time.sleep(0.05) # 50ms

    def start(self):
        self.watcher_thread = threading.Thread(target=self.watch_message_file, daemon=True)
        self.watcher_thread.start()

        while True:
            message = self.coder.get_input()
            self.run([message])

server = AiderServer()
server.start()
