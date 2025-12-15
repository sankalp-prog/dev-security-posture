#!/bin/bash

# macOS Running Services Enumeration Script
# Equivalent to Windows: Get-CimInstance Win32_Service | Where-Object { $_.State -eq "Running" }
# Collects: Name, DisplayName, ProcessId, StartMode, PathName

# Configuration
SERVER_URL="${SERVER_URL:-http://127.0.0.1:4000/api/help-download/postData}"

echo "========================================="
echo "   macOS Running Services Enumeration"
echo "========================================="
echo ""
echo "Collecting detailed running services..."
echo ""

# Collect running services
collect_running_services() {
    services_json="["
    first=true

    # Get list of all loaded launchd services
    while IFS= read -r line; do
        # Parse launchctl list output: PID STATUS LABEL
        pid=$(echo "$line" | awk '{print $1}')
        status=$(echo "$line" | awk '{print $2}')
        label=$(echo "$line" | awk '{print $3}')

        # Only include services that are actually running (have a PID)
        if [[ "$pid" =~ ^[0-9]+$ ]]; then
            # Try to find the plist file for this service to get more details
            plist_path=""
            display_name="$label"
            start_mode="Unknown"
            path_name=""

            # Search for plist in common locations
            for search_dir in \
                "/System/Library/LaunchDaemons" \
                "/System/Library/LaunchAgents" \
                "/Library/LaunchDaemons" \
                "/Library/LaunchAgents" \
                "$HOME/Library/LaunchAgents"; do

                if [ -f "$search_dir/${label}.plist" ]; then
                    plist_path="$search_dir/${label}.plist"

                    # Try to get Program path
                    path_name=$(/usr/libexec/PlistBuddy -c "Print :Program" "$plist_path" 2>/dev/null || \
                               /usr/libexec/PlistBuddy -c "Print :ProgramArguments:0" "$plist_path" 2>/dev/null || \
                               echo "")

                    # Try to get Label (display name)
                    display_name=$(/usr/libexec/PlistBuddy -c "Print :Label" "$plist_path" 2>/dev/null || echo "$label")

                    # Determine start mode
                    run_at_load=$(/usr/libexec/PlistBuddy -c "Print :RunAtLoad" "$plist_path" 2>/dev/null || echo "false")
                    keep_alive=$(/usr/libexec/PlistBuddy -c "Print :KeepAlive" "$plist_path" 2>/dev/null || echo "false")

                    if [ "$run_at_load" = "true" ] || [ "$keep_alive" = "true" ]; then
                        start_mode="Automatic"
                    else
                        start_mode="Manual"
                    fi

                    break
                fi
            done

            # If no path found, try to get it from running process
            if [ -z "$path_name" ]; then
                path_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "")
            fi

            # Build JSON object (matching Windows service structure)
            if [ "$first" = true ]; then
                first=false
            else
                services_json+=","
            fi

            # Escape quotes in strings
            label_escaped=$(echo "$label" | sed 's/"/\\"/g')
            display_name_escaped=$(echo "$display_name" | sed 's/"/\\"/g')
            path_name_escaped=$(echo "$path_name" | sed 's/"/\\"/g')

            services_json+=$(cat <<EOF
{
  "Name": "$label_escaped",
  "DisplayName": "$display_name_escaped",
  "ProcessId": $pid,
  "StartMode": "$start_mode",
  "PathName": "$path_name_escaped"
}
EOF
)
        fi
    done < <(launchctl list 2>/dev/null)

    services_json+="]"
    echo "$services_json"
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

# Collect the services data
SERVICES_JSON=$(collect_running_services)

# Get MAC address
MAC_ADDRESS=$(get_mac_address)
TIMESTAMP=$(date +%s)

# Count services
SERVICE_COUNT=$(echo "$SERVICES_JSON" | grep -o '"Name"' | wc -l | tr -d ' ')
echo "Found $SERVICE_COUNT running services"
echo "MAC Address: $MAC_ADDRESS"
echo "Timestamp: $TIMESTAMP"
echo ""

echo "Converting to JSON..."
# Wrap services in proper format with MAC address
JSON_PAYLOAD=$(cat <<EOF
[
  {
    "addresses": {
      "mac_address": "$MAC_ADDRESS",
      "last_updated_timestamp": $TIMESTAMP
    },
    "services": $SERVICES_JSON
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
