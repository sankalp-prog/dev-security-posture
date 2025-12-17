// src/controllers/helpDownload.controller.ts
import { Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import path from "path";
import fs from "fs";

// ✅ GET /api/help-download/getOs
export const getOs = async (req: Request, res: Response): Promise<void> => {
  try {
    const uaString = req.headers["user-agent"] || "";
    const parser = new UAParser(uaString);

    const result = {
      os: parser.getOS(),
      cpu: parser.getCPU(),
      browser: parser.getBrowser(),
      engine: parser.getEngine(),
      device: parser.getDevice(),
      result: parser.getResult(),
    };

    res.json(result);
  } catch (error) {
    console.error("Error parsing User-Agent:", error);
    res.status(500).json({ error: "Failed to parse User-Agent" });
  }
};

// ✅ GET /api/help-download/download-script
export const downloadScript = async (
  req: Request<unknown, unknown, unknown, { os?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { os } = req.query;

    if (!os) {
      res.status(400).json({ error: "OS query parameter is required" });
      return;
    }

    let filePath: string;
    const osLower = os.toLowerCase();

    if (osLower === "windows") {
      filePath = process.env.DOWNLOAD_WINDOWS_SCRIPT || "";
    } else if (osLower === "linux") {
      filePath = process.env.DOWNLOAD_LINUX_SCRIPT || "";
    } else if (
      osLower === "mac os" ||
      osLower === "macos" ||
      osLower.includes("mac")
    ) {
      filePath = process.env.DOWNLOAD_MACOS_SCRIPT || "";
    } else {
      // Actual response -
      // res.status(400).json({ error: `Invalid OS type: ${os}` });
      // Debugging response -
      console.log(`Invalid OS type: ${os}`);
      res.status(400).json({ error: `Invalid OS type: ${os}` });
      return;
    }

    if (!filePath) {
      res
        .status(500)
        .json({ error: "Script path not configured in environment" });
      return;
    }

    // Dynamically get file name from the path
    const fileName = path.basename(filePath);

    // Set headers
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/octet-stream");
    // Expose header so frontend JS can read the filename
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        if (!res.headersSent) {
          res.status(500).send("Error downloading file");
        }
      }
    });
  } catch (error) {
    console.error("Error in downloadScript:", error);
    res.status(500).json({ error: "Failed to download script" });
  }
};

// ✅ POST /api/help-download/postData
export const postData = async (req: Request, res: Response): Promise<void> => {
  try {
    let raw: any = req.body.output || req.body;

    // If raw is a string, normalize it
    if (typeof raw === "string") {
      raw = raw.replace(/'/g, '"').replace(/\bNone\b/g, "null");
      raw = JSON.parse(raw);
    }

    const data = raw;

    if (!data) {
      res.status(400).json({ error: "No data provided" });
      return;
    }

    // Extract MAC address
    let macAddress = "unknownmac";

    // New format: Check root level metadata first
    if (data.metadata?.mac_address) {
      macAddress = data.metadata.mac_address;
    }
    // Handle array of payloads
    else if (Array.isArray(data)) {
      for (const item of data) {
        if (item.metadata?.mac_address) {
          macAddress = item.metadata.mac_address;
          break;
        }
        // Legacy format fallback
        if (item.app_list?.[0]?.mac_address) {
          macAddress = item.app_list[0].mac_address;
          break;
        }
      }
    }

    // Clean MAC: remove non-alphanumeric, lowercase
    macAddress = macAddress.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // Extract timestamp
    let timestamp = Date.now().toString();
    let isoTimestamp = new Date().toISOString();

    // New format: Check root level metadata first
    if (data.metadata?.timestamp) {
      isoTimestamp = data.metadata.timestamp;
      // Convert ISO timestamp to Unix timestamp for filename
      timestamp = new Date(data.metadata.timestamp).getTime().toString();
    }
    // Handle array of payloads
    else if (Array.isArray(data)) {
      for (const item of data) {
        if (item.metadata?.timestamp) {
          isoTimestamp = item.metadata.timestamp;
          timestamp = new Date(item.metadata.timestamp).getTime().toString();
          break;
        }
        // Legacy format fallbacks
        if (item.addresses?.last_updated_timestamp) {
          timestamp = item.addresses.last_updated_timestamp.toString();
          break;
        }
        if (item.system_info?.last_updated_timestamp) {
          timestamp = item.system_info.last_updated_timestamp.toString();
          break;
        }
      }
    }

    // Log received data info
    console.log(`[INFO] Received data from MAC: ${macAddress}`);
    console.log(`[INFO] Timestamp: ${isoTimestamp}`);
    console.log(
      `[INFO] Hostname: ${data.metadata?.hostname || "not provided"}`
    );
    console.log(
      `[INFO] macOS Version: ${data.metadata?.macos_version || "not provided"}`
    );
    console.log(
      `[INFO] Hardware Model: ${
        data.metadata?.hardware_model || "not provided"
      }`
    );
    console.log(
      `[INFO] App count: ${
        data.metadata?.app_count || data.apps?.length || "unknown"
      }`
    );

    const APP_DATA = process.env.APP_DATA_FILE || "";
    if (!APP_DATA) {
      res
        .status(500)
        .json({ error: "APP_DATA_FILE path not configured in environment" });
      return;
    }

    const fileName = `installed_apps_${macAddress}_${timestamp}.json`;
    const filePath = path.join(APP_DATA, fileName);

    // Ensure directory exists
    if (!fs.existsSync(APP_DATA)) {
      fs.mkdirSync(APP_DATA, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`[SUCCESS] Data saved to: ${filePath}`);

    res.status(200).json({
      success: true,
      message: "Data saved successfully",
      filePath,
      mac_address: macAddress,
      timestamp: isoTimestamp,
      app_count: data.metadata?.app_count || data.apps?.length || 0,
    });
  } catch (error: any) {
    console.error("[ERROR] Failed to save data:", error);
    res.status(500).json({
      error: "Failed to save data",
      details: error.message,
    });
  }
};

// ✅ GET /api/help-download/user-guide
export const downloadUserGuide = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const filePath = process.env.ADA_USER_GUIDE || "";
    if (!filePath) {
      res.status(500).json({ error: "User guide file path not configured" });
      return;
    }

    const fileName = path.basename(filePath);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");
    // Expose header for frontend
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error sending user guide:", err);
        if (!res.headersSent) {
          res.status(500).send("Error downloading user guide");
        }
      }
    });
  } catch (error) {
    console.error("Error in downloadUserGuide:", error);
    res.status(500).json({ error: "Failed to download user guide" });
  }
};

// // src/controllers/helpDownload.controller.ts
// import { Request, Response } from "express";
// import { UAParser } from "ua-parser-js";
// import path from "path";
// import fs from "fs";

// // Environment variables
// const DOWNLOAD_WINDOWS_SCRIPT = process.env.DOWNLOAD_WINDOWS_SCRIPT || "";
// const DOWNLOAD_LINUX_SCRIPT = process.env.DOWNLOAD_LINUX_SCRIPT || "";
// const APP_DATA = process.env.APP_DATA_FILE || "";
// const USER_GUIDE = process.env.ADA_USER_GUIDE || "";

// // ✅ GET /api/help-download/getOs
// export const getOs = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const uaString = req.headers["user-agent"] || "";
//     const parser = new UAParser(uaString);

//     const result = {
//       os: parser.getOS(),
//       cpu: parser.getCPU(),
//       browser: parser.getBrowser(),
//       engine: parser.getEngine(),
//       device: parser.getDevice(),
//       result: parser.getResult(),
//     };

//     res.json(result);
//   } catch (error) {
//     console.error("Error parsing User-Agent:", error);
//     res.status(500).json({ error: "Failed to parse User-Agent" });
//   }
// };

// // ✅ GET /api/help-download/download-script
// export const downloadScript = async (
//   req: Request<unknown, unknown, unknown, { os?: string }>,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { os } = req.query;

//     if (!os) {
//       res.status(400).json({ error: "OS query parameter is required" });
//       return;
//     }

//     let filePath: string;
//     let fileName: string;

//     if (os.toLowerCase() === "windows") {
//       fileName = "windows_file.exe";
//       filePath = DOWNLOAD_WINDOWS_SCRIPT;
//     } else if (os.toLowerCase() === "linux") {
//       fileName = "linux_file.sh";
//       filePath = DOWNLOAD_LINUX_SCRIPT;
//     } else {
//       res.status(400).json({ error: "Invalid OS type" });
//       return;
//     }

//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Content-Type", "application/octet-stream");

//     res.download(filePath, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         if (!res.headersSent) {
//           res.status(500).send("Error downloading file");
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error in downloadScript:", error);
//     res.status(500).json({ error: "Failed to download script" });
//   }
// };

// // ✅ POST /api/help-download/postData
// export const postData = async (req: Request, res: Response): Promise<void> => {
//   try {
//     let raw: any = req.body.output || req.body;

//     // If raw is a string, normalize it
//     if (typeof raw === "string") {
//       raw = raw.replace(/'/g, '"').replace(/\bNone\b/g, "null");
//       raw = JSON.parse(raw);
//     }

//     const data = raw;

//     if (!data) {
//       res.status(400).json({ error: "No data provided" });
//       return;
//     }

//     // Safely extract MAC address
//     let macAddress = "unknownmac";
//     if (Array.isArray(data)) {
//       for (const item of data) {
//         if (item.addresses?.mac_address) {
//           macAddress = item.addresses.mac_address;
//           break;
//         }
//         if (item.app_list?.[0]?.mac_address) {
//           macAddress = item.app_list[0].mac_address;
//           break;
//         }
//       }
//     }

//     // Clean MAC: remove non-alphanumeric, lowercase
//     macAddress = macAddress.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

//     // Safely extract timestamp
//     let timestamp = Date.now().toString();
//     if (Array.isArray(data)) {
//       for (const item of data) {
//         if (item.addresses?.last_updated_timestamp) {
//           timestamp = item.addresses.last_updated_timestamp.toString();
//           break;
//         }
//         if (item.system_info?.last_updated_timestamp) {
//           timestamp = item.system_info.last_updated_timestamp.toString();
//           break;
//         }
//       }
//     }

//     const fileName = `installed_apps_${macAddress}_${timestamp}.json`;
//     const filePath = path.join(APP_DATA, fileName);

//     // Ensure directory exists
//     if (!fs.existsSync(APP_DATA)) {
//       fs.mkdirSync(APP_DATA, { recursive: true });
//     }

//     // Write file
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

//     res.status(200).json({ message: "Data saved successfully", filePath });
//   } catch (error: any) {
//     console.error("Error in postData:", error);
//     res.status(500).json({
//       error: "Failed to save data",
//       details: error.message,
//     });
//   }
// };

// // ✅ GET /api/help-download/user-guide
// export const downloadUserGuide = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const filePath = USER_GUIDE || "";
//     if (!filePath) {
//       res.status(500).json({ error: "User guide file path not configured" });
//       return;
//     }

//     const fileName = "ADA User Guide.pdf";

//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Content-Type", "application/pdf");

//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         console.error("Error sending user guide:", err);
//         if (!res.headersSent) {
//           res.status(500).send("Error downloading user guide");
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error in downloadUserGuide:", error);
//     res.status(500).json({ error: "Failed to download user guide" });
//   }
// };
