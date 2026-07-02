Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
URL_FILE = "C:\Users\user\Downloads\KHAIRATY\phone_url.txt"
PID_FILE = "C:\Users\user\Downloads\KHAIRATY\tunnel.pid"
LOG_FILE = "C:\Users\user\Downloads\KHAIRATY\tunnel_watchdog.log"

Sub Log(msg)
    On Error Resume Next
    Dim f
    Set f = FSO.OpenTextFile(LOG_FILE, 8, True)
    f.WriteLine Now() & " " & msg
    f.Close
End Sub

Do While True
    ' Check if SSH is running
    Dim sshRunning
    sshRunning = False
    If FSO.FileExists(PID_FILE) Then
        Dim pidFile
        Set pidFile = FSO.OpenTextFile(PID_FILE)
        Dim pid
        pid = pidFile.ReadLine()
        pidFile.Close
        Dim cmd
        cmd = "cmd /c tasklist /FI ""PID eq " & pid & """ /NH"
        Dim ws
        Set ws = CreateObject("WScript.Shell")
        Dim result
        result = ws.Run(cmd, 0, True)
    End If
    
    ' Check if handle-able via netstat
    Dim found
    found = False
    Dim sshCheck
    sshCheck = ws.Run("cmd /c netstat -ano | findstr :8000 | findstr LISTENING > nul", 0, True)
    
    If sshCheck = 0 Then
        ' Backend is running, check tunnel
        Dim checkTunnel
        checkTunnel = ws.Run("cmd /c netstat -ano | findstr 5.255.123.12:22 > nul", 0, True)
        If checkTunnel = 0 Then
            Log("OK - tunnel alive")
        Else
            Log("WARN - no SSH connection, restarting")
            WshShell.Run "C:\Python314\python.exe C:\Users\user\Downloads\KHAIRATY\tunnel_manager.py", 0, False
        End If
    End If
    
    WScript.Sleep 30000
Loop
