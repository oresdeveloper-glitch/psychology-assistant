import subprocess, re, time, sys, os
URL_FILE = r"C:\Users\user\Downloads\KHAIRATY\phone_url.txt"
PID_FILE = r"C:\Users\user\Downloads\KHAIRATY\tunnel.pid"

# Kill previous tunnel if any
if os.path.exists(PID_FILE):
    try:
        with open(PID_FILE) as f:
            old_pid = int(f.read().strip())
        os.kill(old_pid, 9)
    except:
        pass

proc = subprocess.Popen(
    ["ssh.exe", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30",
     "-R", "80:127.0.0.1:8000", "serveo.net"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

with open(PID_FILE, "w") as f:
    f.write(str(proc.pid))

url = None
for line in proc.stdout:
    clean = re.sub(r'\x1b\[[0-9;]*m', "", line).strip()
    m = re.search(r"https://[^\s]+", clean)
    if m:
        url = m.group()
        with open(URL_FILE, "w") as f:
            f.write(url + "\n")
        print(f"Tunnel URL: {url}", flush=True)
        break

if not url:
    print("ERROR: No URL found", flush=True)
    sys.exit(1)

try:
    proc.wait()
except KeyboardInterrupt:
    proc.terminate()
