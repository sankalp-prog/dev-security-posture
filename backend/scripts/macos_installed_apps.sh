#!/usr/bin/env bash
set -u

API_URL="http://127.0.0.1:4000/api/help-download/postData"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

echo "▶ Collecting system metadata..."

# Get MAC address (primary network interface)
MAC_ADDRESS=$(ifconfig en0 2>/dev/null | awk '/ether/{print $2}')
if [[ -z "$MAC_ADDRESS" ]]; then
  # Fallback to first available interface with MAC
  MAC_ADDRESS=$(ifconfig | awk '/ether/{print $2; exit}')
fi

# Get timestamp in ISO 8601 format
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get hostname
HOSTNAME=$(hostname)

# Get macOS version
MACOS_VERSION=$(sw_vers -productVersion)

# Get hardware model
HARDWARE_MODEL=$(sysctl -n hw.model)

echo "✔ System metadata collected."
echo "  - MAC Address: $MAC_ADDRESS"
echo "  - Hostname: $HOSTNAME"
echo "  - macOS Version: $MACOS_VERSION"
echo "  - Timestamp: $TIMESTAMP"

echo "▶ Collecting application data from Launch Services..."

apps_data=$(
  "$LSREGISTER" -dump |
  awk '
  BEGIN { 
    reset()
    in_bundle = 0
  }
  
  function reset() {
    path=""
    directory=""
    name=""
    displayName=""
    identifier=""
    version=""
    versionString=""
    displayVersion=""
    mod_date=""
    reg_date=""
  }
  
  # Detect separator line - emit previous bundle if it had a path
  /^--------------------------------------------------------------------------------$/ {
    if (in_bundle && path != "") {
      emit()
    }
    reset()
    in_bundle = 0
    next
  }
  
  # Start of new bundle
  /^bundle id:/ {
    in_bundle = 1
    next
  }
  
  # Only process fields if we are in a bundle section
  in_bundle {
    if (/^path:.*\.app/) {
      sub(/^path:[ \t]+/, "")
      sub(/ \(0x[0-9a-f]+\).*$/, "")
      path=$0
    }
    else if (/^directory:/) {
      sub(/^directory:[ \t]+/, "")
      directory=$0
    }
    else if (/^name:/) {
      sub(/^name:[ \t]+/, "")
      name=$0
    }
    else if (/^displayName:/) {
      sub(/^displayName:[ \t]+/, "")
      displayName=$0
    }
    else if (/^identifier:/) {
      sub(/^identifier:[ \t]+/, "")
      identifier=$0
    }
    else if (/^version:/) {
      sub(/^version:[ \t]+/, "")
      sub(/ \({.*$/, "")
      version=$0
    }
    else if (/^versionString:/) {
      sub(/^versionString:[ \t]+/, "")
      versionString=$0
    }
    else if (/^displayVersion:/) {
      sub(/^displayVersion:[ \t]+/, "")
      displayVersion=$0
    }
    else if (/^mod date:/) {
      sub(/^mod date:[ \t]+/, "")
      sub(/ \(POSIX.*$/, "")
      mod_date=$0
    }
    else if (/^reg date:/) {
      sub(/^reg date:[ \t]+/, "")
      sub(/ \(POSIX.*$/, "")
      reg_date=$0
    }
  }
  
  function emit() {
    # Only emit if we have at least a path
    if (path == "") return
    
    printf("{")
    sep=""
    if (name != "")           { printf("%s\"name\":\"%s\"", sep, name); sep="," }
    if (displayName != "")    { printf("%s\"displayName\":\"%s\"", sep, displayName); sep="," }
    if (identifier != "")     { printf("%s\"identifier\":\"%s\"", sep, identifier); sep="," }
    if (path != "")           { printf("%s\"path\":\"%s\"", sep, path); sep="," }
    if (directory != "")      { printf("%s\"directory\":\"%s\"", sep, directory); sep="," }
    if (version != "")        { printf("%s\"version\":\"%s\"", sep, version); sep="," }
    if (versionString != "")  { printf("%s\"versionString\":\"%s\"", sep, versionString); sep="," }
    if (displayVersion != "") { printf("%s\"displayVersion\":\"%s\"", sep, displayVersion); sep="," }
    if (mod_date != "")       { printf("%s\"mod date\":\"%s\"", sep, mod_date); sep="," }
    if (reg_date != "")       { printf("%s\"reg date\":\"%s\"", sep, reg_date); sep="," }
    printf("}\n")
  }
  
  # Emit the last record at end of file
  END {
    if (in_bundle && path != "") {
      emit()
    }
  }
  ' |
  jq -s '.'
)

if [[ -z "$apps_data" || "$apps_data" == "[]" ]]; then
  echo "❌ Failed to extract application data."
  echo "   Launch Services output was parsed but no app records were produced."
  exit 1
fi

app_count=$(echo "$apps_data" | jq 'length')
echo "✔ Application data collected ($app_count apps found)."

# Construct final payload with metadata and apps
echo "▶ Building payload with metadata..."

payload=$(jq -n \
  --arg mac "$MAC_ADDRESS" \
  --arg timestamp "$TIMESTAMP" \
  --arg hostname "$HOSTNAME" \
  --arg macos_version "$MACOS_VERSION" \
  --arg hardware_model "$HARDWARE_MODEL" \
  --argjson apps "$apps_data" \
  '{
    metadata: {
      mac_address: $mac,
      timestamp: $timestamp,
      hostname: $hostname,
      macos_version: $macos_version,
      hardware_model: $hardware_model,
      app_count: ($apps | length)
    },
    apps: $apps
  }'
)

echo "✔ Payload built successfully."
echo "▶ Sending data to API..."

http_code=$(curl -sS -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$payload")

if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
  echo "✅ Data successfully sent to $API_URL"
  echo "   - MAC: $MAC_ADDRESS"
  echo "   - Apps: $app_count"
  echo "   - Timestamp: $TIMESTAMP"
else
  echo "❌ Failed to send data to $API_URL"
  echo "   HTTP status code: $http_code"
  exit 1
fi