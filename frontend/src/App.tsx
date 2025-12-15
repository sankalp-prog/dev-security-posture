// ==========================================
// SIMPLIFIED APP FOR LOCAL DEVELOPMENT
// ==========================================
// This is a simplified version for local dev - only shows Help/Download page
// The full production app is commented out below

import React from 'react';
import Help from "./pages/Help";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Help />
      </div>
    </div>
  );
};

export default App;


// ==========================================
// FULL PRODUCTION APP (COMMENTED OUT)
// ==========================================
// Uncomment this when you have all dependencies and files installed

// // client/src/App.tsx
// import React from 'react';
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { Provider } from 'react-redux';
// import { store } from './store/store';
// import { AuthProvider } from './contexts/AuthContext';
// import { DashboardProvider } from './contexts/DashboardContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
// import { AppSidebar } from "./components/AppSidebar";
// import { AppNavbar } from "./components/AppNavbar";

// // Logging

// import Auth from "./pages/Logging/Auth";
// import TakeEmail from './pages/Logging/TakeEmail';
// import UploadLicense from './pages/Logging/UploadLicense';

// // Main pages
// import Index from "./pages/Index";
// import Application from "./pages/Application";
// import Users from "./pages/Users";
// import Risk from "./pages/Risk";
// import Alerts from "./pages/Alerts";
// import SystemHealth from "./pages/SystemHealth";
// import SystemShell from "./pages/SystemShell";
// import Reports from "./pages/Reports";
// import SettingsPage from "./pages/SettingsPage";
// import Help from "./pages/Help";
// import NotFound from "./pages/NotFound";

// // Settings sub-pages
// import SystemNetwork from "./components/settings/SystemNetwork";
// import Security from "./components/settings/Security";
// import UsersGroup from "./components/settings/UsersGroup";
// import Decoy from "./components/settings/Decoy";
// import License from "./components/settings/License";
// import SensorManagement from './components/settings/SensorManagement';
// import WirelessProbe from "./components/settings/WirelessProbe";
// import Threshold from "./components/settings/Threshold";
// import ThreatIntel from "./components/settings/ThreatIntel";
// import ResponseAction from "./components/settings/ResponseAction";
// import CertificateManagement from "./components/settings/CertificateManagement";

// const queryClient = new QueryClient();

// const App = () => (
//   <Provider store={store}>
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter basename="/ada">
//           <AuthProvider>
//             <Routes>
//               {/* Public Auth Route */}
//               <Route path="/auth" element={<Auth />} />
//               <Route path="/takeEmail" element={<TakeEmail />} />
//               <Route path="/uploadLicense" element={<UploadLicense />} />
//               {/* <Route path="/auth" element={<Auth />} /> */}
//
//               {/* Protected Routes */}
//               <Route
//                 path="/*"
//                 element={
//                   <ProtectedRoute>
//                     <DashboardProvider>
//                       <SidebarProvider>
//                         <div className="min-h-screen flex w-full">
//                           <AppSidebar />
//                           <SidebarInset className="flex-1">
//                             <AppNavbar />
//                             <main className="flex-1">
//                               <Routes>
//                                 {/* Main Dashboard Pages */}
//                                 <Route path="/" element={<Index />} />
//                                 <Route path="/application" element={<Application />} />
//                                 <Route path="/users" element={<Users />} />
//                                 <Route path="/risk" element={<Risk />} />
//                                 <Route path="/alerts" element={<Alerts />} />
//                                 <Route path="/system-health" element={<SystemHealth />} />
//                                 <Route path="/system-shell" element={<SystemShell />} />
//                                 <Route path="/reports" element={<Reports />} />

//                                 {/* Settings Landing Page */}
//                                 <Route path="/settings" element={<SettingsPage />} />

//                                 {/* Settings Sub-Pages */}
//                                 <Route path="/settings/system-network" element={<SystemNetwork />} />
//                                 <Route path="/settings/security" element={<Security />} />
//                                 <Route path="/settings/users-group" element={<UsersGroup />} />
//                                 <Route path="/settings/decoy" element={<Decoy />} />
//                                 <Route path="/settings/license" element={<License />} />
//                                 <Route path="/settings/sensor-management" element={<SensorManagement />} />
//                                 <Route path="/settings/wireless-probe" element={<WirelessProbe />} />
//                                 <Route path="/settings/threshold" element={<Threshold />} />
//                                 <Route path="/settings/threat-intel" element={<ThreatIntel />} />
//                                 <Route path="/settings/response-action" element={<ResponseAction />} />
//                                 <Route path="/settings/certificate-management" element={<CertificateManagement />} />

//                                 {/* Help & Fallback */}
//                                 <Route path="/help" element={<Help />} />
//                                 <Route path="*" element={<NotFound />} />
//                               </Routes>
//                             </main>
//                           </SidebarInset>
//                         </div>
//                       </SidebarProvider>
//                     </DashboardProvider>
//                   </ProtectedRoute>
//                 }
//               />
//             </Routes>
//           </AuthProvider>
//         </BrowserRouter>
//       </TooltipProvider>
//     </QueryClientProvider>
//   </Provider>
// );

// export default App;