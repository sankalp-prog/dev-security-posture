import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutTab from "@/components/help/AboutTab";
import ReferenceTab from "@/components/help/ReferenceTab";
import DownloadTab from "@/components/help/DownloadTab";

const Help = () => {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
        <p className="text-lg text-gray-600">
          Get help and documentation for Asset Management System
        </p>
      </div>

      <Tabs defaultValue="download" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="reference">Reference</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          <AboutTab />
        </TabsContent>
        <TabsContent value="reference" className="space-y-6">
          <ReferenceTab />
        </TabsContent>
        <TabsContent value="download" className="space-y-6">
          <DownloadTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;