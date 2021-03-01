import subprocess
import sys
import shutil

def runCmd(cmd):
	r = subprocess.run(cmd, shell=True)
	if r.returncode != 0:
		print("Command failed: ", cmd)
		sys.exit()	

def log(l):
	print(">>> ", l)


log("Building")
runCmd("npm install")

if sys.platform == 'win32':
	runCmd("npm run package-win")
else:
	runCmd("npm run package-mac")

log("Packaging...")
shutil.make_archive("rtptool", "zip", "release-builds")Т