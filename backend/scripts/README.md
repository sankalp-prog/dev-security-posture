# Enumeration Scripts

This folder contains platform-specific enumeration scripts for client systems.

## Files

- **`windows_dev_scan.exe`** - Windows enumeration executable (placeholder)
- **`linux_dev_scan.sh`** - Linux enumeration shell script (placeholder)
- **`macos_dev_scan.sh`** - macOS enumeration shell script ✅ **WORKING**

## macOS Script (macos_dev_scan.sh)

### What It Does
Collects detailed running services on macOS (equivalent to Windows `Get-CimInstance Win32_Service`):
- **Name** - Service identifier (launchd label)
- **DisplayName** - Human-readable service name
- **ProcessId** - Running process ID
- **StartMode** - Automatic or Manual
- **PathName** - Executable path

### How to Use

**1. Download the script from the web app:**
- Visit the Help/Download page
- Click "Download Script" (auto-detects macOS)

**2. Run the script:**
```bash
# Make executable (if not already)
chmod +x macos_dev_scan.sh

# Run with default server (http://127.0.0.1:4000)
./macos_dev_scan.sh

# Or specify custom server URL
SERVER_URL="http://your-server.com/api/help-download/postData" ./macos_dev_scan.sh
```

### Output Example
```json
[
  {
    "Name": "com.apple.WindowServer",
    "DisplayName": "com.apple.WindowServer",
    "ProcessId": 123,
    "StartMode": "Automatic",
    "PathName": "/System/Library/PrivateFrameworks/SkyLight.framework/Resources/WindowServer"
  },
  {
    "Name": "com.apple.Finder",
    "DisplayName": "com.apple.Finder",
    "ProcessId": 456,
    "StartMode": "Automatic",
    "PathName": "/System/Library/CoreServices/Finder.app/Contents/MacOS/Finder"
  }
]
```

### Script Behavior
1. Collects all running launchd services (system + user)
2. Parses service details from `.plist` files in:
   - `/System/Library/LaunchDaemons`
   - `/System/Library/LaunchAgents`
   - `/Library/LaunchDaemons`
   - `/Library/LaunchAgents`
   - `~/Library/LaunchAgents`
3. Converts to JSON matching Windows service structure
4. POSTs to backend endpoint automatically
5. Shows success/failure message

## Windows & Linux Scripts

These are currently placeholder files. Replace with actual enumeration scripts that:

1. Collect detailed running services
2. Convert to JSON (same format as macOS script)
3. POST collected data to `/api/help-download/postData` endpoint

### Windows PowerShell Example
```powershell
# Collect running services
$services = Get-CimInstance Win32_Service |
    Where-Object { $_.State -eq "Running" } |
    Select-Object Name, DisplayName, ProcessId, StartMode, PathName

# Convert to JSON
$json = $services | ConvertTo-Json -Depth 10

# Send to server
curl -X POST `
     -H "Content-Type: application/json" `
     --data-binary $json `
     "http://127.0.0.1:4000/api/help-download/postData"
```
