from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main
from flask import Flask, request, jsonify
import threading
import logging
import json

coder = main(return_coder=True)
app = Flask(__name__)

def get_coder_state():
	global coder

	return { 
		"abs_fnames": list(coder.abs_fnames),
		"abs_read_only_fnames": list(coder.abs_read_only_fnames),
		"edit_format": coder.edit_format
	}

def run(message=None): 
	global coder
	
	try:
		# coder.ok_to_warm_cache = bool(args.cache_keepalive_pings)
		if message is not None:
			coder.io.tool_output()
			coder.io.tool_output(f"Nova: {message}", bold=True) 

		coder.run(message)

		return
	except SwitchCoder as switch:
		coder.ok_to_warm_cache = False
		io = coder.io
	
		# Set the placeholder if provided
		if hasattr(switch, "placeholder") and switch.placeholder is not None:
			io.placeholder = switch.placeholder
	
		kwargs = dict(io=io, from_coder=coder)
		kwargs.update(switch.kwargs)
		if "show_announcements" in kwargs:
			del kwargs["show_announcements"]
	
		coder = Coder.create(**kwargs)
	
		if switch.kwargs.get("show_announcements") is not False:
			coder.show_announcements()

@app.route('/api/coder', methods=["GET"])
def api_coder_get():
	try:
		return jsonify({ "coder": get_coder_state() }), 200
	except Exception as e:
		return jsonify({"error": str(e)}), 500

@app.route('/api/coder', methods=['POST'])
def api_coder_post():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Invalid request, 'message' field required"}), 400
        message = data['message']
        
        # Process the message with Aider
        run(message)
        
        return jsonify({ "message": message, "coder": get_coder_state() }), 200
    except Exception as e:
        return jsonify({ "error": jsonify(e) }), 500

def run_flask_server():
    # Disable Werkzeug's default logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    app.run(host='127.0.0.1', port=5000, debug=False)
    app.logger.setLevel(logging.ERROR)

# Start the Flask server in a separate thread
flask_thread = threading.Thread(target=run_flask_server, daemon=True)
flask_thread.start()

# Main Aider loop
while True:
    run()