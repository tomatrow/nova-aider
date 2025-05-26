from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main
from flask import Flask, request, jsonify
import threading
import logging
import json
import traceback
import os

class AiderServer:
    def __init__(self):
        self.coder = main(return_coder=True)
        self.app = Flask(__name__)
        self.setup_routes()

    def setup_routes(self):
        self.app.route('/api/coder', methods=["GET"])(self.api_coder_get)
        self.app.route('/api/coder', methods=['POST'])(self.api_coder_post)

    def get_coder_state(self):
        return { 
            "abs_fnames": list(self.coder.abs_fnames),
            "abs_read_only_fnames": list(self.coder.abs_read_only_fnames),
            "edit_format": self.coder.edit_format
        }

    def api_coder_get(self):
        try:
            # need to run this on the main thread
            coder_state = self.get_coder_state()
            
            return jsonify({ "coder": coder_state }), 200
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    def run(self, messages):
        for message in messages:
            try:
                self.coder.run_one(message, True)
            except SwitchCoder as switch:
                io = self.coder.io
                kwargs = dict(io=io, from_coder=self.coder)
                kwargs.update(switch.kwargs)
                self.coder = Coder.create(**kwargs)
            os.makedirs('.aider.nova.cache.v1', exist_ok=True)
            coder_state = self.get_coder_state()
            with open('.aider.nova.cache.v1/coder.json', 'w') as f:
                json.dump(coder_state, f, indent=2)

    def api_coder_post(self):
        try:
            data = request.get_json()
            if not data or 'messages' not in data or not isinstance(data['messages'], list):
                return jsonify({"error": "Invalid request, 'messages' array field required"}), 400

            messages = data['messages']

            self.coder.io.interrupt_input()
            self.run(messages)
            coder_state = self.get_coder_state()

            return jsonify({ "messages": messages, "coder": coder_state }), 200
        except Exception as e:
            traceback.print_exc()
            return jsonify({ "error": str(e) }), 500

    def run_flask_server(self):
        # Create an array (list) of server configurations
        server_configs = [
            {'host': '127.0.0.1', 'port': 5000, 'debug': False},
            {'host': 'localhost', 'port': 5000, 'debug': False},
            {'host': '0.0.0.0', 'port': 5000, 'debug': False}  # Allow external connections
        ]
        
        # Use the first configuration by default
        config = server_configs[0]
        
        # Disable Werkzeug's default logging if needed
        if not config['debug']:
            log = logging.getLogger('werkzeug')
            log.setLevel(logging.ERROR)
            self.app.logger.setLevel(logging.ERROR)
        
        # Run the Flask server with the selected configuration
        self.app.run(
            host=config['host'], 
            port=config['port'], 
            debug=config['debug']
        )

    def start(self):
        # Start the Flask server in a separate thread
        flask_thread = threading.Thread(target=self.run_flask_server, daemon=True)
        flask_thread.start()

        while True:
            message = self.coder.get_input()
            self.run(message)

# Create and run server
server = AiderServer()
server.start()
