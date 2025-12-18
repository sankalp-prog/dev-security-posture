# Network Access Setup Guide

## Overview

This document explains how to configure the development environment to make both the backend and frontend accessible from other devices on your local network (WiFi/LAN). By default, servers bind to `127.0.0.1` (localhost), which restricts access to only the host machine. This guide details the changes needed to enable network-wide access.

---

## Table of Contents

1. [Understanding the Problem](#understanding-the-problem)
2. [Changes Made](#changes-made)
3. [How to Use](#how-to-use)
4. [Security Considerations](#security-considerations)
5. [Troubleshooting](#troubleshooting)

---

## Understanding the Problem

### What is `127.0.0.1` (localhost)?

- **`127.0.0.1`** is the loopback address, also known as **localhost**
- When a server binds to `127.0.0.1`, it only accepts connections from the same machine
- Other devices on your network **cannot** access services running on `127.0.0.1`
- This is a security feature that prevents unintended external access

### What is `0.0.0.0`?

- **`0.0.0.0`** is a special address that means "all available network interfaces"
- When a server binds to `0.0.0.0`, it accepts connections from:
  - Localhost (`127.0.0.1`)
  - Your machine's local network IP (e.g., `192.168.1.100`)
  - Any other network interface on your machine
- This allows other devices on your local network to connect

### Example Scenario

**Before changes:**
```
Your laptop IP: 192.168.1.100
Backend binds to: 127.0.0.1:4000

✅ You can access: http://127.0.0.1:4000 (on your laptop)
❌ Phone cannot access: http://192.168.1.100:4000 (connection refused)
```

**After changes:**
```
Your laptop IP: 192.168.1.100
Backend binds to: 0.0.0.0:4000

✅ You can access: http://127.0.0.1:4000 (on your laptop)
✅ You can access: http://192.168.1.100:4000 (on your laptop)
✅ Phone can access: http://192.168.1.100:4000 (on WiFi)
```

---

## Changes Made

### 1. Backend Changes (`backend/index.ts`)

**Location:** Line 113

**Before:**
```typescript
server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server running ONLY on http://127.0.0.1:${PORT}`);
});
```

**After:**
```typescript
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT} (accessible from local network)`);
});
```

**Why this change?**

The `server.listen()` method takes three parameters:
1. **PORT** - The port number (default 4000)
2. **HOST** - The network interface to bind to
3. **CALLBACK** - Function to run when server starts

By changing the second parameter from `"127.0.0.1"` to `"0.0.0.0"`, the Express server now listens on all network interfaces instead of just localhost.

**What this enables:**
- Backend API can be accessed from other devices on the network
- You can use your machine's local IP address (e.g., `192.168.1.100:4000`)
- Mobile devices on the same WiFi can test the API

**CORS Note:**
The backend already uses `app.use(cors())` (line 39), which allows requests from any origin. No CORS changes were needed.

---

### 2. Frontend Changes (`frontend/vite.config.ts`)

**Location:** Lines 13-16 (added new section)

**Before:**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**After:**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,      // Default Vite port
  },
})
```

**Why this change?**

Vite's development server (like Express) defaults to binding to localhost. The `server` configuration object allows us to customize this behavior:

- **`host: '0.0.0.0'`** - Binds to all network interfaces
- **`port: 5173`** - Explicitly sets the port (Vite's default)

**What this enables:**
- Frontend dev server can be accessed from other devices
- You can use your machine's local IP address (e.g., `192.168.1.100:5173`)
- Mobile devices can view the frontend UI

**Alternative Configuration:**

You can also set the host to `true` for automatic network exposure:
```typescript
server: {
  host: true, // Automatically expose on network
}
```

---

## How to Use

### Step 1: Find Your Local IP Address

**On macOS:**
```bash
# For WiFi (most common)
ipconfig getifaddr en0

# For Ethernet
ipconfig getifaddr en1

# Or see all network interfaces
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Linux:**
```bash
hostname -I

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for an address like:
- `192.168.x.x` (common home/office networks)
- `10.0.x.x` (common for some routers)
- `172.16.x.x` to `172.31.x.x` (less common)

**Example:** Let's say your IP is `192.168.1.100`

---

### Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://0.0.0.0:4000 (accessible from local network)
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see something like:
```
VITE v7.2.4  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

**Note:** Vite will automatically display your network IP when you use `host: '0.0.0.0'`

---

### Step 3: Access from Other Devices

Using the example IP `192.168.1.100`:

**From your laptop (host machine):**
- Frontend: `http://localhost:5173` or `http://192.168.1.100:5173`
- Backend: `http://localhost:4000` or `http://192.168.1.100:4000`

**From other devices (phone, tablet, another computer):**
- Frontend: `http://192.168.1.100:5173`
- Backend: `http://192.168.1.100:4000`

**Important:** Replace `192.168.1.100` with YOUR actual local IP address!

---

### Step 4: Update Frontend API Calls (If Needed)

If your frontend makes API calls using hardcoded URLs like `http://127.0.0.1:4000`, you'll need to update them to use your local IP for testing from other devices.

**Example - Hardcoded (works only on host machine):**
```typescript
const response = await fetch('http://127.0.0.1:4000/api/help-download/getOs');
```

**Example - Using environment variable (recommended):**
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const response = await fetch(`${API_BASE}/api/help-download/getOs`);
```

Then create `frontend/.env` or `frontend/.env.local`:
```
VITE_API_URL=http://192.168.1.100:4000
```

**Note:** For production, you'd use relative URLs or proper environment configuration.

---

## Security Considerations

### Important Warnings

1. **Firewall Protection:**
   - Binding to `0.0.0.0` exposes your services to your local network
   - Ensure your firewall is configured properly
   - macOS will typically prompt you to allow incoming connections

2. **Development Only:**
   - These settings are for **development/testing purposes only**
   - Do NOT use `0.0.0.0` binding in production without proper security measures
   - Production servers should use reverse proxies (nginx, Apache) and proper security

3. **Trusted Networks:**
   - Only use this configuration on trusted networks (home, office)
   - Avoid public WiFi networks when running with these settings
   - Anyone on your network can access your services

4. **No Authentication:**
   - Your dev servers have no authentication
   - Anyone on your network can make API requests
   - Be careful with destructive operations

### macOS Firewall Prompt

When you first start the backend with `0.0.0.0` binding, macOS may show:
```
Do you want the application "node" to accept incoming network connections?
```

Click **Allow** if you're on a trusted network.

---

## Troubleshooting

### Issue: Cannot connect from other devices

**Possible Causes & Solutions:**

1. **Wrong IP Address**
   - Verify your IP: `ipconfig getifaddr en0` (macOS)
   - Your IP might change if you reconnect to WiFi
   - Use the IP shown in Vite's output

2. **Firewall Blocking**
   - Check macOS Firewall: System Preferences → Security & Privacy → Firewall
   - Temporarily disable to test (not recommended for public networks)
   - Allow node/npm through firewall

3. **Different Network**
   - Ensure both devices are on the **same WiFi network**
   - Some networks isolate devices (guest networks, corporate)
   - Try a personal hotspot if corporate WiFi blocks device-to-device

4. **VPN Interference**
   - Disconnect VPN and try again
   - VPNs can route traffic differently

5. **Port Already in Use**
   - Backend: Check if port 4000 is in use
   - Frontend: Check if port 5173 is in use
   - Kill existing processes or change ports

**Test Connectivity:**
```bash
# From the other device (if it has curl/bash)
curl http://192.168.1.100:4000/api/help-download/getOs

# Or just open in mobile browser
http://192.168.1.100:4000/api/help-download/getOs
```

---

### Issue: "Connection Refused" Error

**Solutions:**

1. Verify servers are running:
   ```bash
   # Check if backend is running on port 4000
   lsof -i :4000

   # Check if frontend is running on port 5173
   lsof -i :5173
   ```

2. Check if binding succeeded:
   - Look for the console message showing `0.0.0.0`
   - If it says `127.0.0.1`, the changes didn't apply

3. Restart the servers after making changes

---

### Issue: Backend works but frontend doesn't connect to API

**Solution:**

Check your frontend API configuration. If using hardcoded `localhost` or `127.0.0.1`, update to use the network IP:

```typescript
// ❌ Won't work from other devices
fetch('http://localhost:4000/api/...')

// ✅ Works from other devices
fetch('http://192.168.1.100:4000/api/...')

// ✅ Best - use environment variable
fetch(`${import.meta.env.VITE_API_URL}/api/...`)
```

---

### Issue: Changes not taking effect

**Solutions:**

1. **Restart the servers completely** (Ctrl+C and restart)
2. Clear any cached builds:
   ```bash
   # Frontend
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```
3. Verify the changes are in the files:
   ```bash
   # Check backend
   grep "0.0.0.0" backend/index.ts

   # Check frontend
   grep "0.0.0.0" frontend/vite.config.ts
   ```

---

## Technical Deep Dive

### How Network Binding Works

When you create a server and call `.listen()`, the operating system:

1. **Creates a socket** - A communication endpoint
2. **Binds to an interface** - Associates the socket with a network interface and port
3. **Listens for connections** - Waits for incoming TCP connections

**Interface Options:**

| Bind Address | Meaning | Access From |
|--------------|---------|-------------|
| `127.0.0.1` | Loopback only | Same machine only |
| `0.0.0.0` | All interfaces | Any interface, including network |
| Specific IP | Single interface | That interface only |

**Example:**
```javascript
// Localhost only
server.listen(4000, '127.0.0.1');  // Only 127.0.0.1:4000 works

// All interfaces
server.listen(4000, '0.0.0.0');    // 127.0.0.1:4000 AND 192.168.x.x:4000 work

// Specific interface
server.listen(4000, '192.168.1.100'); // Only 192.168.1.100:4000 works
```

---

### Network Topology

```
┌─────────────────────────────────────────────┐
│           Your WiFi Router (192.168.1.1)    │
└─────────────────┬───────────────────────────┘
                  │
     ┌────────────┼────────────┬──────────────┐
     │            │            │              │
┌────▼─────┐ ┌───▼──────┐ ┌───▼───────┐ ┌───▼────────┐
│  Laptop  │ │  Phone   │ │  Tablet   │ │  Desktop   │
│  .100    │ │   .105   │ │   .110    │ │   .120     │
└──────────┘ └──────────┘ └───────────┘ └────────────┘
   (HOST)

   Backend:  0.0.0.0:4000
   Frontend: 0.0.0.0:5173

   All devices can access:
   - http://192.168.1.100:4000
   - http://192.168.1.100:5173
```

---

## Reverting Changes

If you want to go back to localhost-only access:

**Backend (`backend/index.ts` line 113):**
```typescript
server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server running ONLY on http://127.0.0.1:${PORT}`);
});
```

**Frontend (`frontend/vite.config.ts`):**
```typescript
// Remove the server configuration entirely, or set:
server: {
  host: 'localhost',
}
```

Then restart both servers.

---

## Summary

### What Changed
1. ✅ Backend now binds to `0.0.0.0` instead of `127.0.0.1`
2. ✅ Frontend Vite server binds to `0.0.0.0` instead of default localhost
3. ✅ Both services are accessible from local network devices

### Access Points
- **Frontend:** `http://<YOUR_LOCAL_IP>:5173`
- **Backend:** `http://<YOUR_LOCAL_IP>:4000`

### Security Reminder
- Only use on trusted networks
- Development configuration, not for production
- Firewall protection recommended

---

## Additional Resources

- [Express.js API Documentation - app.listen()](https://expressjs.com/en/4x/api.html#app.listen)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Understanding TCP/IP Networking](https://en.wikipedia.org/wiki/Internet_protocol_suite)
- [RFC 1122 - Loopback Address](https://tools.ietf.org/html/rfc1122)

---

**Last Updated:** 2025-12-18
