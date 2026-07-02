import subprocess, threading, time, re, os, sys, signal

log_path = os.path.join(os.path.dirname(__file__), "..", "tunnel_url.txt")
proc = None

def read_output(pipe):
    global proc
    url_pattern = re.compile(r'(https?://[a-zA-Z0-9.-]+\.lhr\.life)')
    for line in iter(pipe.readline, ""):
        print(line.strip())
        sys.stdout.flush()
        m = url_pattern.search(line)
        if m:
            url = m.group(1)
            with open(log_path, "w") as f:
                f.write(url + "\n")
            print("\n=== PUBLIC URL: %s ===\n" % url)

proc = subprocess.Popen(
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30",
     "-R", "80:localhost:8000", "nokey@localhost.run"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    text=True, bufsize=1, creationflags=subprocess.CREATE_NO_WINDOW
)

print("Tunnel PID: %d" % proc.pid)
thread = threading.Thread(target=read_output, args=(proc.stdout,), daemon=True)
thread.start()

try:
    proc.wait()
except KeyboardInterrupt:
    proc.terminate()
