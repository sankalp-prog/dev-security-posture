# Enumeration Scripts

This folder contains platform-specific enumeration scripts for client systems.

## Files

- **`windows_enumeration.exe`** - Windows enumeration executable (currently a dummy placeholder)
- **`linux_enumeration.sh`** - Linux enumeration shell script (currently a dummy placeholder)

## Production Setup

Replace these dummy files with actual enumeration scripts that:

1. Collect installed applications
2. Gather network configuration (including MAC address)
3. Collect system information
4. POST collected data to `/api/help-download/postData` endpoint

## Expected Data Format

The scripts should send JSON data with this structure:

```json
[
  {
    "addresses": {
      "mac_address": "aa:bb:cc:dd:ee:ff",
      "last_updated_timestamp": 1702650000
    },
    "system_info": {
      "os": "Windows 10",
      "hostname": "DESKTOP-ABC123"
    },
    "app_list": [
      {
        "name": "Application Name",
        "version": "1.0.0"
      }
    ]
  }
]
```
