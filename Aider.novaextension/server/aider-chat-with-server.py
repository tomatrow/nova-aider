from aider.commands import SwitchCoder
from aider.coders import Coder
from aider.main import main

coder = main(return_coder=True)

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