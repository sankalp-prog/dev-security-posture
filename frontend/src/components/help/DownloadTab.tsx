// src/components/help/DownloadTab.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CircularProgress from "@/components/ui/CircularProgress"; // <- make sure you have this component

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DownloadTab = () => {
  const { toast } = useToast();
  const [os, setOs] = useState<string>("Unknown");
  const [loadingOs, setLoadingOs] = useState<boolean>(false);
  const [scriptOutput, setScriptOutput] = useState<string>("");
  const [showInstructions, setShowInstructions] = useState(false);

  // Progress states
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [scriptDownloading, setScriptDownloading] = useState(false);
  const [scriptProgress, setScriptProgress] = useState(0);

  // Fetch detected OS on mount
  useEffect(() => {
    const fetchOs = async () => {
      setLoadingOs(true);
      try {
        const res = await fetch(`${API_BASE}/api/help-download/getOs`);
        const data = await res.json();
        setOs(data?.os?.name || "Unknown");
      } catch (err) {
        console.error("Error fetching OS:", err);
        toast({
          title: "Error",
          description: "Failed to detect OS",
          variant: "destructive",
        });
      } finally {
        setLoadingOs(false);
      }
    };
    fetchOs();
  }, [toast]);

  // Handle PDF download with progress
  const handleDownloadPDF = () => {
    setPdfDownloading(true);
    setPdfProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_BASE}/api/help-download/user-guide`, true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        setPdfProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const url = window.URL.createObjectURL(xhr.response);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ADA_User_Guide.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast({
          title: "Download started",
          description: "User Guide PDF is downloading...",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to download PDF",
          variant: "destructive",
        });
      }
      setPdfDownloading(false);
      setPdfProgress(0);
    };

    xhr.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
      setPdfDownloading(false);
      setPdfProgress(0);
    };

    xhr.send();
  };

  const handleDownloadScript = () => {
    if (!os || os === "Unknown") {
      toast({
        title: "Error",
        description: "OS not detected",
        variant: "destructive",
      });
      return;
    }

    setScriptDownloading(true);
    setScriptProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `${API_BASE}/api/help-download/download-script?os=${os}`,
      true
    );
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        setScriptProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // Use filename from Content-Disposition header
        const disposition = xhr.getResponseHeader("Content-Disposition");
        let fileName = "script";
        if (disposition && disposition.includes("filename=")) {
          const fileNameMatch = disposition.match(/filename="?(.+?)"?$/);
          if (fileNameMatch?.[1]) {
            fileName = fileNameMatch[1].trim(); // remove extra spaces
            fileName = fileName.replace(/"/g, ""); // remove quotes if any
          }
        }

        const url = window.URL.createObjectURL(xhr.response);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName; // <-- dynamic file name from backend
        document.body.appendChild(a);
        a.click();
        a.remove();

        toast({
          title: "Download started",
          description: `Script for ${os} is downloading...`,
        });

        // Show instructions after successful download
        setShowInstructions(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to download script",
          variant: "destructive",
        });
      }

      setScriptDownloading(false);
      setScriptProgress(0);
    };

    xhr.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to download script",
        variant: "destructive",
      });
      setScriptDownloading(false);
      setScriptProgress(0);
    };

    xhr.send();
  };

  // Handle submit script output
  const handleSubmit = async () => {
    if (!scriptOutput.trim()) {
      toast({
        title: "Error",
        description: "Please paste script output",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/help-download/postData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: scriptOutput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save data");

      toast({
        title: "Success",
        description: "Script output uploaded successfully",
      });
      setScriptOutput("");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Center
        </CardTitle>
        <CardDescription>
          Download documentation, tools, and resources
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Documentation Section */}
        <section>
          <h3 className="font-semibold text-lg mb-4">Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">User Manual</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {/* Complete user guide and documentation (PDF, 51 pages) */}
                Complete user guide and documentation (PDF, 1 page)
              </p>
              <Button size="sm" className="w-full" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>

              {pdfDownloading && (
                <div className="flex flex-col items-center mt-2">
                  <CircularProgress value={pdfProgress} className="w-12 h-12" />
                  <span className="text-sm mt-1">
                    {Math.round(pdfProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tools & Utilities */}
        <section>
          <h3 className="font-semibold text-lg mb-4">Tools & Utilities</h3>
          <div className="space-y-6">
            {/* Download Script Card */}
            <div className="p-4 border rounded-lg hover:shadow-md transition w-full">
              <div className="flex items-center gap-3 mb-2">
                <Download className="h-5 w-5 text-primary" />
                <span className="font-medium">Download Script</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                client script
              </p>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <span className="text-sm">
                  <span className="font-medium">OS:</span>{" "}
                  {loadingOs ? "Detecting..." : os}
                </span>
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={handleDownloadScript}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Script
                </Button>
              </div>
              {scriptDownloading && (
                <div className="flex flex-col items-center mt-2">
                  <CircularProgress
                    value={scriptProgress}
                    className="w-12 h-12"
                  />
                  <span className="text-sm mt-1">
                    {Math.round(scriptProgress)}%
                  </span>
                </div>
              )}
            </div>

            {/* Instructions Section - Shows after download */}
            {showInstructions && (
              <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Play className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      How to Run the Script
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Follow these steps to execute the enumeration script
                    </p>
                  </div>
                </div>

                {/* Instructions based on OS */}
                {os.toLowerCase().includes("mac") ||
                os.toLowerCase().includes("linux") ? (
                  // macOS/Linux Instructions
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          1
                        </span>
                        <span className="font-medium text-gray-900">
                          Open Terminal
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        Navigate to your Downloads folder
                      </p>
                      <div className="mt-2 ml-8 p-3 bg-gray-900 text-gray-100 rounded-md font-mono text-sm">
                        cd ~/Downloads
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          2
                        </span>
                        <span className="font-medium text-gray-900">
                          Make Script Executable
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        Grant execution permissions to the script
                      </p>
                      <div className="mt-2 ml-8 p-3 bg-gray-900 text-gray-100 rounded-md font-mono text-sm">
                        chmod +x{" "}
                        {os.toLowerCase().includes("mac")
                          ? "macos_installed_apps.sh"
                          : "linux_dev_scan.sh"}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          3
                        </span>
                        <span className="font-medium text-gray-900">
                          Run the Script
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        Execute the script - it will automatically collect and
                        upload data
                      </p>
                      <div className="mt-2 ml-8 p-3 bg-gray-900 text-gray-100 rounded-md font-mono text-sm">
                        ./
                        {os.toLowerCase().includes("mac")
                          ? "macos_installed_apps.sh"
                          : "linux_dev_scan.sh"}
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                      <p className="text-sm text-green-800">
                        <strong className="font-semibold">✅ That's it!</strong>{" "}
                        The script will automatically:
                      </p>
                      <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
                        <li>• Collect running services information</li>
                        <li>• Convert data to JSON format</li>
                        <li>• Upload results to the server</li>
                        <li>• Show you a success/failure message</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Windows Instructions
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          1
                        </span>
                        <span className="font-medium text-gray-900">
                          Locate the Downloaded File
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        Find the script in your Downloads folder (usually{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          C:\Users\YourName\Downloads
                        </code>
                        )
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          2
                        </span>
                        <span className="font-medium text-gray-900">
                          Run as Administrator
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        Right-click the{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          windows_dev_scan.exe
                        </code>{" "}
                        file and select <strong>"Run as administrator"</strong>
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                          3
                        </span>
                        <span className="font-medium text-gray-900">
                          Allow Execution
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">
                        If Windows Defender shows a warning, click{" "}
                        <strong>"More info"</strong> then{" "}
                        <strong>"Run anyway"</strong>
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                      <p className="text-sm text-green-800">
                        <strong className="font-semibold">✅ That's it!</strong>{" "}
                        The script will automatically:
                      </p>
                      <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
                        <li>• Collect running services information</li>
                        <li>• Convert data to JSON format</li>
                        <li>• Upload results to the server</li>
                        <li>• Show you a success/failure message</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paste Script Output */}
            {/* <div className="p-4 border rounded-lg hover:shadow-md transition w-full">
              <div className="flex items-center gap-2 mb-3">
                <Play className="h-5 w-5 text-primary" />
                <span className="font-medium text-lg">Paste Script Output</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Paste the output of the script below
              </p>
              <textarea
                className="w-full border rounded-md p-2 text-sm resize-none mb-3"
                rows={6}
                placeholder="Paste your output here"
                value={scriptOutput}
                onChange={(e) => setScriptOutput(e.target.value)}
              />
              <Button
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSubmit}
              >
                <Play className="h-4 w-4" />
                Submit
              </Button>
            </div> */}
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default DownloadTab;

// // working with hard coded names for scripts
// // src/components/help/DownloadTab.tsx
// import React, { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Download, FileText, Play } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import CircularProgress  from "@/components/ui/CircularProgress"; // <- make sure you have this component

// const API_BASE = import.meta.env.VITE_API_BASE_URL;

// const DownloadTab = () => {
//   const { toast } = useToast();
//   const [os, setOs] = useState<string>("Unknown");
//   const [loadingOs, setLoadingOs] = useState<boolean>(false);
//   const [scriptOutput, setScriptOutput] = useState<string>("");

//   // Progress states
//   const [pdfDownloading, setPdfDownloading] = useState(false);
//   const [pdfProgress, setPdfProgress] = useState(0);
//   const [scriptDownloading, setScriptDownloading] = useState(false);
//   const [scriptProgress, setScriptProgress] = useState(0);

//   // Fetch detected OS on mount
//   useEffect(() => {
//     const fetchOs = async () => {
//       setLoadingOs(true);
//       try {
//         const res = await fetch(`${API_BASE}/api/help-download/getOs`);
//         const data = await res.json();
//         setOs(data?.os?.name || "Unknown");
//       } catch (err) {
//         console.error("Error fetching OS:", err);
//         toast({ title: "Error", description: "Failed to detect OS", variant: "destructive" });
//       } finally {
//         setLoadingOs(false);
//       }
//     };
//     fetchOs();
//   }, [toast]);

//   // Handle PDF download with progress
//   const handleDownloadPDF = () => {
//     setPdfDownloading(true);
//     setPdfProgress(0);

//     const xhr = new XMLHttpRequest();
//     xhr.open("GET", `${API_BASE}/api/help-download/user-guide`, true);
//     xhr.responseType = "blob";

//     xhr.onprogress = (event) => {
//       if (event.lengthComputable) {
//         setPdfProgress((event.loaded / event.total) * 100);
//       }
//     };

//     xhr.onload = () => {
//       if (xhr.status === 200) {
//         const url = window.URL.createObjectURL(xhr.response);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "ADA_User_Guide.pdf";
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         toast({ title: "Download started", description: "User Guide PDF is downloading..." });
//       } else {
//         toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
//       }
//       setPdfDownloading(false);
//       setPdfProgress(0);
//     };

//     xhr.onerror = () => {
//       toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
//       setPdfDownloading(false);
//       setPdfProgress(0);
//     };

//     xhr.send();
//   };

//   // Handle Script download with progress
//   const handleDownloadScript = () => {
//     if (!os || os === "Unknown") {
//       toast({ title: "Error", description: "OS not detected", variant: "destructive" });
//       return;
//     }

//     setScriptDownloading(true);
//     setScriptProgress(0);

//     const xhr = new XMLHttpRequest();
//     xhr.open("GET", `${API_BASE}/api/help-download/download-script?os=${os}`, true);
//     xhr.responseType = "blob";

//     xhr.onprogress = (event) => {
//       if (event.lengthComputable) {
//         setScriptProgress((event.loaded / event.total) * 100);
//       }
//     };

//     xhr.onload = () => {
//       if (xhr.status === 200) {
//         const url = window.URL.createObjectURL(xhr.response);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = os.toLowerCase() === "windows" ? "windows_file.exe" : "linux_file.sh";
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         toast({ title: "Download started", description: `Script for ${os} is downloading...` });
//       } else {
//         toast({ title: "Error", description: "Failed to download script", variant: "destructive" });
//       }
//       setScriptDownloading(false);
//       setScriptProgress(0);
//     };

//     xhr.onerror = () => {
//       toast({ title: "Error", description: "Failed to download script", variant: "destructive" });
//       setScriptDownloading(false);
//       setScriptProgress(0);
//     };

//     xhr.send();
//   };

//   // Handle submit script output
//   const handleSubmit = async () => {
//     if (!scriptOutput.trim()) {
//       toast({ title: "Error", description: "Please paste script output", variant: "destructive" });
//       return;
//     }
//     try {
//       const res = await fetch(`${API_BASE}/api/help-download/postData`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ output: scriptOutput }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to save data");

//       toast({ title: "Success", description: "Script output uploaded successfully" });
//       setScriptOutput("");
//     } catch (err: any) {
//       console.error("Submit error:", err);
//       toast({ title: "Error", description: err.message, variant: "destructive" });
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Download className="h-5 w-5" />
//           Download Center
//         </CardTitle>
//         <CardDescription>
//           Download documentation, tools, and resources
//         </CardDescription>
//       </CardHeader>

//       <CardContent className="space-y-8">
//         {/* Documentation Section */}
//         <section>
//           <h3 className="font-semibold text-lg mb-4">Documentation</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="p-4 border rounded-lg hover:shadow-md transition">
//               <div className="flex items-center gap-3 mb-2">
//                 <FileText className="h-5 w-5 text-primary" />
//                 <span className="font-medium">User Manual</span>
//               </div>
//               <p className="text-sm text-muted-foreground mb-3">
//                 Complete user guide and documentation (PDF, 51 pages)
//               </p>
//               <Button size="sm" className="w-full" onClick={handleDownloadPDF}>
//                 <Download className="h-4 w-4 mr-2" />
//                 Download PDF
//               </Button>

//               {pdfDownloading && (
//                 <div className="flex flex-col items-center mt-2">
//                   <CircularProgress value={pdfProgress} className="w-12 h-12" />
//                   <span className="text-sm mt-1">{Math.round(pdfProgress)}%</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </section>

//         {/* Tools & Utilities */}
//         <section>
//           <h3 className="font-semibold text-lg mb-4">Tools & Utilities</h3>
//           <div className="space-y-6">
//             {/* Download Script Card */}
//             <div className="p-4 border rounded-lg hover:shadow-md transition w-full">
//               <div className="flex items-center gap-3 mb-2">
//                 <Download className="h-5 w-5 text-primary" />
//                 <span className="font-medium">Download Script</span>
//               </div>
//               <p className="text-sm text-muted-foreground mb-3">
//                 Enumeration client script
//               </p>
//               <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
//                 <span className="text-sm">
//                   <span className="font-medium">OS:</span>{" "}
//                   {loadingOs ? "Detecting..." : os}
//                 </span>
//                 <Button size="sm" className="flex-1 sm:flex-none" onClick={handleDownloadScript}>
//                   <Download className="h-4 w-4 mr-2" />
//                   Download Script
//                 </Button>
//               </div>
//               {scriptDownloading && (
//                 <div className="flex flex-col items-center mt-2">
//                   <CircularProgress value={scriptProgress} className="w-12 h-12" />
//                   <span className="text-sm mt-1">{Math.round(scriptProgress)}%</span>
//                 </div>
//               )}
//             </div>

//             {/* Paste Script Output */}
//             <div className="p-4 border rounded-lg hover:shadow-md transition w-full">
//               <div className="flex items-center gap-2 mb-3">
//                 <Play className="h-5 w-5 text-primary" />
//                 <span className="font-medium text-lg">Paste Script Output</span>
//               </div>
//               <p className="text-sm text-muted-foreground mb-3">
//                 Paste the output of the script below
//               </p>
//               <textarea
//                 className="w-full border rounded-md p-2 text-sm resize-none mb-3"
//                 rows={6}
//                 placeholder="Paste your output here"
//                 value={scriptOutput}
//                 onChange={(e) => setScriptOutput(e.target.value)}
//               />
//               <Button size="sm" className="flex items-center gap-2" onClick={handleSubmit}>
//                 <Play className="h-4 w-4" />
//                 Submit
//               </Button>
//             </div>
//           </div>
//         </section>
//       </CardContent>
//     </Card>
//   );
// };

// export default DownloadTab;
