# Windows Installed Applications Collector
# Collects both UWP/Store apps and traditional Win32 applications

param(
    [string]$ApiUrl = "http://10.40.13.71:4000/api/help-download/postData"
)

$ErrorActionPreference = "Stop"

Write-Host "> Collecting system metadata..." -ForegroundColor Cyan

# Get MAC address (primary network adapter)
$macAddress = ""
try {
    $adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.PhysicalMediaType -eq "802.3"} | Select-Object -First 1
    if ($adapter) {
        $macAddress = $adapter.MacAddress -replace "-", ":"
    }
    # Fallback to any active adapter
    if (-not $macAddress) {
        $adapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1
        if ($adapter) {
            $macAddress = $adapter.MacAddress -replace "-", ":"
        }
    }
} catch {
    Write-Warning "Could not retrieve MAC address: $_"
    $macAddress = "unknown"
}

# Get timestamp in ISO 8601 format (UTC)
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Get hostname
$hostname = $env:COMPUTERNAME

# Get Windows version
$osInfo = Get-CimInstance Win32_OperatingSystem
$windowsVersion = $osInfo.Version
$windowsCaption = $osInfo.Caption

# Get hardware model
$computerInfo = Get-CimInstance Win32_ComputerSystem
$hardwareModel = "$($computerInfo.Manufacturer) $($computerInfo.Model)"

Write-Host "[OK] System metadata collected." -ForegroundColor Green
Write-Host "  - MAC Address: $macAddress"
Write-Host "  - Hostname: $hostname"
Write-Host "  - Windows Version: $windowsCaption ($windowsVersion)"
Write-Host "  - Timestamp: $timestamp"

Write-Host ""
Write-Host "> Collecting installed applications..." -ForegroundColor Cyan

$allApps = @()

# 1. Collect UWP/Store Apps (Get-AppxPackage)
Write-Host "  - Collecting UWP/Store applications..."
try {
    $uwpApps = Get-AppxPackage | Where-Object {$_.Name -ne $null}
    
    foreach ($app in $uwpApps) {
        $appObj = [ordered]@{
            name = $app.Name
            packageFullName = $app.PackageFullName
            version = $app.Version.ToString()
            publisher = $app.Publisher
            installLocation = $app.InstallLocation
            architecture = $app.Architecture.ToString()
            packageFamilyName = $app.PackageFamilyName
            isFramework = $app.IsFramework
            type = "UWP"
        }
        $allApps += $appObj
    }
    Write-Host "    [OK] Found $($uwpApps.Count) UWP/Store apps" -ForegroundColor Gray
} catch {
    Write-Warning "Failed to collect UWP apps: $_"
}

# 2. Collect Win32 Apps from Registry (64-bit)
Write-Host "  - Collecting Win32 applications (64-bit)..."
try {
    $regPath64 = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    $win32Apps64 = Get-ItemProperty $regPath64 -ErrorAction SilentlyContinue | 
        Where-Object { $_.DisplayName -and $_.DisplayName -ne "" }
    
    foreach ($app in $win32Apps64) {
        $appObj = [ordered]@{
            name = $app.DisplayName
            version = $app.DisplayVersion
            publisher = $app.Publisher
            installLocation = $app.InstallLocation
            installDate = $app.InstallDate
            uninstallString = $app.UninstallString
            type = "Win32"
            architecture = "x64"
        }
        $allApps += $appObj
    }
    Write-Host "    [OK] Found $($win32Apps64.Count) Win32 apps (64-bit)" -ForegroundColor Gray
} catch {
    Write-Warning "Failed to collect Win32 64-bit apps: $_"
}

# 3. Collect Win32 Apps from Registry (32-bit on 64-bit systems)
Write-Host "  - Collecting Win32 applications (32-bit)..."
try {
    $regPath32 = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
    $win32Apps32 = Get-ItemProperty $regPath32 -ErrorAction SilentlyContinue | 
        Where-Object { $_.DisplayName -and $_.DisplayName -ne "" }
    
    foreach ($app in $win32Apps32) {
        $appObj = [ordered]@{
            name = $app.DisplayName
            version = $app.DisplayVersion
            publisher = $app.Publisher
            installLocation = $app.InstallLocation
            installDate = $app.InstallDate
            uninstallString = $app.UninstallString
            type = "Win32"
            architecture = "x86"
        }
        $allApps += $appObj
    }
    Write-Host "    [OK] Found $($win32Apps32.Count) Win32 apps (32-bit)" -ForegroundColor Gray
} catch {
    Write-Warning "Failed to collect Win32 32-bit apps: $_"
}

# 4. Collect Per-User Apps from Registry
Write-Host "  - Collecting per-user applications..."
try {
    $regPathUser = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    $userApps = Get-ItemProperty $regPathUser -ErrorAction SilentlyContinue | 
        Where-Object { $_.DisplayName -and $_.DisplayName -ne "" }
    
    foreach ($app in $userApps) {
        $appObj = [ordered]@{
            name = $app.DisplayName
            version = $app.DisplayVersion
            publisher = $app.Publisher
            installLocation = $app.InstallLocation
            installDate = $app.InstallDate
            uninstallString = $app.UninstallString
            type = "Win32"
            architecture = "User"
        }
        $allApps += $appObj
    }
    Write-Host "    [OK] Found $($userApps.Count) per-user apps" -ForegroundColor Gray
} catch {
    Write-Warning "Failed to collect per-user apps: $_"
}

$totalApps = $allApps.Count
Write-Host ""
Write-Host "[OK] Application data collected ($totalApps apps found)." -ForegroundColor Green

# Build payload with metadata
Write-Host "> Building payload with metadata..." -ForegroundColor Cyan

$payload = @{
    metadata = @{
        mac_address = $macAddress
        timestamp = $timestamp
        hostname = $hostname
        windows_version = $windowsVersion
        windows_caption = $windowsCaption
        hardware_model = $hardwareModel
        app_count = $totalApps
    }
    apps = $allApps
} | ConvertTo-Json -Depth 10

Write-Host "[OK] Payload built successfully." -ForegroundColor Green
Write-Host "> Sending data to API..." -ForegroundColor Cyan

try {
    # Send to API
    $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 30
    
    Write-Host ""
    Write-Host "[SUCCESS] Data successfully sent to $ApiUrl" -ForegroundColor Green
    Write-Host "   - MAC: $macAddress"
    Write-Host "   - Apps: $totalApps"
    Write-Host "   - Timestamp: $timestamp"
    
    if ($response) {
        Write-Host ""
        Write-Host "Server Response:"
        $response | ConvertTo-Json -Depth 5 | Write-Host
    }
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to send data to $ApiUrl" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Save payload to file as backup
    $backupFile = "windows_apps_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    $payload | Out-File -FilePath $backupFile -Encoding UTF8
    Write-Host "   [SAVED] Payload saved to backup file: $backupFile" -ForegroundColor Yellow
    
    exit 1
}
