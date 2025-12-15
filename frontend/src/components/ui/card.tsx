// Simplified Card components for local development
import React from 'react';

export const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className || ''}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>{children}</div>;
};

export const CardTitle: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight text-gray-900 ${className || ''}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return <p className={`text-sm text-gray-600 ${className || ''}`}>{children}</p>;
};

export const CardContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return <div className={`p-6 pt-0 ${className || ''}`}>{children}</div>;
};
