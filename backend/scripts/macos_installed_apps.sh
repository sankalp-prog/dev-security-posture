#!/bin/bash

# macOS Installed Applications Enumeration Script
# Scans /Applications, ~/Applications, and /System/Applications for installed apps
# Collects: Name, Version, BundleIdentifier, Path, Size

# Configuration
SERVER_URL="${SERVER_URL:-http://127.0.0.1:4000/api/help-download/postData}"

echo "========================================="
echo "   macOS Installed Apps Enumeration"
echo "========================================="
echo ""
echo "Collecting installed applications..."
echo ""

# Collect installed applications
collect_installed_apps() {
    apps_json="["
    first=true

    # Search for .app bundles in common locations
    app_dirs=(
        "/Applications"
        "/System/Applications"
        "$HOME/Applications"
        "/System/Library/CoreServices"
    )

    for app_dir in "${app_dirs[@]}"; do
        if [ ! -d "$app_dir" ]; then
            continue
        fi

        # Find all .app bundles in this directory (not recursive beyond .app)
        while IFS= read -r app_path; do
            if [ ! -d "$app_path" ]; then
                continue
            fi

            # Get app name (remove .app extension)
            app_name=$(basename "$app_path" .app)

            # Try to read Info.plist
            info_plist="$app_path/Contents/Info.plist"

            # Initialize variables
            bundle_id=""
            version=""
            display_name="$app_name"

            if [ -f "$info_plist" ]; then
                # Get bundle identifier
                bundle_id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$info_plist" 2>/dev/null || echo "")

                # Get version (try multiple version keys)
                version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$info_plist" 2>/dev/null || \
                         /usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$info_plist" 2>/dev/null || \
                         echo "Unknown")

                # Get display name
                display_name=$(/usr/libexec/PlistBuddy -c "Print :CFBundleDisplayName" "$info_plist" 2>/dev/null || \
                              /usr/libexec/PlistBuddy -c "Print :CFBundleName" "$info_plist" 2>/dev/null || \
                              echo "$app_name")
            fi

            # Get app size (in MB)
            app_size=$(du -sm "$app_path" 2>/dev/null | awk '{print $1}')
            if [ -z "$app_size" ]; then
                app_size="0"
            fi

            # Build JSON object
            if [ "$first" = true ]; then
                first=false
            else
                apps_json+=","
            fi

            # Escape quotes in strings
            name_escaped=$(echo "$display_name" | sed 's/"/\\"/g')
            bundle_id_escaped=$(echo "$bundle_id" | sed 's/"/\\"/g')
            version_escaped=$(echo "$version" | sed 's/"/\\"/g')
            path_escaped=$(echo "$app_path" | sed 's/"/\\"/g')

            apps_json+=$(cat <<EOF
{
  "Name": "$name_escaped",
  "BundleIdentifier": "$bundle_id_escaped",
  "Version": "$version_escaped",
  "Path": "$path_escaped",
  "SizeMB": $app_size
}
EOF
)
        done < <(find "$app_dir" -maxdepth 1 -name "*.app" 2>/dev/null)
    done

    apps_json+="]"
    echo "$apps_json"
}

# Get MAC Address
get_mac_address() {
    # Try to get MAC from en0 (usually primary interface)
    mac=$(ifconfig en0 2>/dev/null | awk '/ether/{print $2}')

    # If en0 doesn't exist, try en1
    if [ -z "$mac" ]; then
        mac=$(ifconfig en1 2>/dev/null | awk '/ether/{print $2}')
    fi

    # Fallback to any interface
    if [ -z "$mac" ]; then
        mac=$(ifconfig | grep -m1 'ether' | awk '{print $2}')
    fi

    echo "$mac"
}

# Collect the apps data
APPS_JSON=$(collect_installed_apps)

# Get MAC address
MAC_ADDRESS=$(get_mac_address)
TIMESTAMP=$(date +%s)

# Count apps
APP_COUNT=$(echo "$APPS_JSON" | grep -o '"Name"' | wc -l | tr -d ' ')
echo "Found $APP_COUNT installed applications"
echo "MAC Address: $MAC_ADDRESS"
echo "Timestamp: $TIMESTAMP"
echo ""

echo "Converting to JSON..."
# Wrap apps in proper format with MAC address
JSON_PAYLOAD=$(cat <<EOF
[
  {
    "addresses": {
      "mac_address": "$MAC_ADDRESS",
      "last_updated_timestamp": $TIMESTAMP
    },
    "apps": $APPS_JSON
  }
]
EOF
)

echo "Sending data to server: $SERVER_URL"
echo ""

# Send data via curl (using --data-binary to avoid truncation)
response=$(curl -s -w "\n%{http_code}" -X POST \
     -H "Content-Type: application/json" \
     --data-binary "$JSON_PAYLOAD" \
     "$SERVER_URL")

# Parse response
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

echo "========================================="
if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: Data uploaded successfully!"
    echo ""
    echo "Server response:"
    echo "$response_body" | python3 -m json.tool 2>/dev/null || echo "$response_body"
else
    echo "❌ ERROR: Failed to upload data"
    echo "HTTP Status Code: $http_code"
    echo ""
    echo "Response:"
    echo "$response_body"
fi
echo "========================================="
