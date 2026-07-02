import subprocess, os, sys
os.chdir(r"C:\Users\user\Downloads\KHAIRATY\frontend")
proc = subprocess.Popen(
    ["npx.cmd", "vite", "--host", "0.0.0.0", "--port", "5173"],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=0)
for line in proc.stdout:
    clean = line.strip()
    if clean:
        print(clean, flush=True)
