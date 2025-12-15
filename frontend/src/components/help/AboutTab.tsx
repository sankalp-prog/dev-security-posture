// Stub AboutTab component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Asset Management System - Help & Documentation
        </p>
        <p className="text-sm text-gray-500 mt-4">
          This is a placeholder About tab. Add your content here.
        </p>
      </CardContent>
    </Card>
  );
};

export default AboutTab;
