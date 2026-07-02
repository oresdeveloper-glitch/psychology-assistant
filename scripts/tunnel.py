import subprocess, time, re, sys, os, signal

log_path = os.path.join(os.path.dirname(__file__), "..", "tunnel_url.txt")

proc = subprocess.Popen(
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30",
     "-R", "80:localhost:8000", "nokey@localhost.run"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
)

print("Tunnel started (PID: %d)" % proc.pid)
print("Waiting for URL...")

for line in iter(proc.stdout.readline, ""):
    print(line.strip())
    sys.stdout.flush()
    m = re.search(r'(https?://[a-zA-Z0-9.-]+\.localhost\.run)', line)
    if m:
        url = m.group(1)
        with open(log_path, "w") as f:
            f.write(url)
        print("\n=== PHONE URL: %s ===\n" % url)
        break

proc.wait()
