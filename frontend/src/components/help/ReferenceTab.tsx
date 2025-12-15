// Stub ReferenceTab component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReferenceTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Reference documentation and guides
        </p>
        <p className="text-sm text-gray-500 mt-4">
          This is a placeholder Reference tab. Add your content here.
        </p>
      </CardContent>
    </Card>
  );
};

export default ReferenceTab;
