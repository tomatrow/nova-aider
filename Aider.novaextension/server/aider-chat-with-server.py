from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main
import threading
from flask import Flask, request, jsonify
import json

coder = main(return_coder=True)

# Start Flask server
app = Flask(__name__)

@app.route('/api/run', methods=['POST'])
def run_command():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Invalid request, 'message' field required"}), 400
        
        message = data['message']
        
        # Process the message with Aider
        # This is a simple implementation - you might need to adapt how messages
        # are sent to the coder based on Aider's API
        response = coder.io.send_msg(message)
        
        return jsonify({"response": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def run_flask_server():
    app.run(host='127.0.0.1', port=5000, debug=False)

# Start the Flask server in a separate thread
flask_thread = threading.Thread(target=run_flask_server, daemon=True)
flask_thread.start()

# Main Aider loop
while True:
	try:
		# coder.ok_to_warm_cache = bool(args.cache_keepalive_pings)
		coder.run()
		break
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
