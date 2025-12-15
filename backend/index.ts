import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";

// ===== Routes ===== //
// import authRoutes from './routes/auth.routes';
// import assetRoutes from './routes/asset.routes';
// import alertRoutes from './routes/alert.routes';
// import applicationRoutes from './routes/application.routes';
// import riskRoutes from './routes/risk.routes';
// import shellRoutes from './routes/shell.routes';
// import systemHealthRoutes from './routes/systemHealth.routes';
// import reportRoutes from "./routes/report.routes";
import helpDownloadRoutes from "./routes/helpDownload.routes";
// import receiveJsonRoutes from './routes/receiveJson.routes';
// import firewallRoutes from './routes/firewall.routes';
// import systemNetworkRoutes from './routes/systemNetwork.routes';
// import certificateManagementRoutes from './routes/certificateManagement.routes';
// import threatIntelRoutes from './routes/threatIntel.routes';

// ===== Controllers ===== //
// import { getSystemHealthData } from './controllers/systemHealth.controller';

// ===== WebSockets ===== //
// import { setupFirewallWebsocket } from './websockets/firewall.websocket';

// Load env variables
dotenv.config();

// Debug: Check if env variables are loaded
console.log("🔍 Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("DOWNLOAD_WINDOWS_SCRIPT:", process.env.DOWNLOAD_WINDOWS_SCRIPT);
console.log("DOWNLOAD_LINUX_SCRIPT:", process.env.DOWNLOAD_LINUX_SCRIPT);

const app = express();
// const PORT = process.env.PORT || 5000;
const PORT: number = Number(process.env.PORT) || 5000;

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
app.use(cors());

// app.use((req, res, next) => {
//   if (req.method === "GET") return next();
//   express.json({ strict: false })(req, res, next);
// });

app.use((req, res, next) => {
  if (req.method === "GET") return next();
  express.json({ limit: "100mb", strict: false })(req, res, next);
});

// ------------------------------------------------------------
// REST Routes
// ------------------------------------------------------------
// app.use("/api/auth", authRoutes);
// app.use("/api/assets", assetRoutes);
// app.use("/api/alerts", alertRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use("/api/shell", shellRoutes);
// app.use("/api/system-health", systemHealthRoutes);
// app.use("/api/reports", reportRoutes);
app.use("/api/help-download", helpDownloadRoutes);
// app.use("/api/risk", riskRoutes);
// app.use("/api", receiveJsonRoutes);
// app.use("/api/firewall", firewallRoutes);
// app.use("/api/systemNetwork", systemNetworkRoutes);
// app.use("/api/certificateManagement", certificateManagementRoutes);
// app.use("/api/threatIntel", threatIntelRoutes);

// ------------------------------------------------------------
// Create HTTP Server
// ------------------------------------------------------------
const server = http.createServer(app);

// ------------------------------------------------------------
// WebSocket Server (one single instance)
// ------------------------------------------------------------
// const wss = new WebSocketServer({ server });

// ------------------------------------------------------------
// 1️⃣ SYSTEM HEALTH WEBSOCKET HANDLER
// ------------------------------------------------------------
// wss.on("connection", (ws) => {
//   console.log("🔌 Client connected to system health WebSocket");

//   const sendData = async () => {
//     try {
//       const data = await getSystemHealthData();
//       if (ws.readyState === ws.OPEN) {
//         ws.send(JSON.stringify({ endpoint: "systemHealth", data }));
//       }
//     } catch (err) {
//       console.error("Error sending system health data:", err);
//     }
//   };

//   sendData();
//   const interval = setInterval(sendData, 2000);

//   ws.on("close", () => {
//     console.log("❌ Client disconnected from system health WebSocket");
//     clearInterval(interval);
//   });
// });

// ------------------------------------------------------------
// 2️⃣ FIREWALL WEBSOCKET HANDLER (Attach to SAME wss)
// ------------------------------------------------------------
// setupFirewallWebsocket(wss);

// ------------------------------------------------------------
// Start Server
// ------------------------------------------------------------
server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server running ONLY on http://127.0.0.1:${PORT}`);
  // console.log(`🔌 WebSocket server WS running ONLY at ws://127.0.0.1:${PORT}`);
});

// // ------------------------------------------------------------
// // Start Server
// // ------------------------------------------------------------
// server.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`🔌 WebSocket server WS running at ws://localhost:${PORT}`);
// });
