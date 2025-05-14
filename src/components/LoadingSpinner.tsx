
import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16"
  };
  
  return (
    <div className="flex justify-center items-center h-64">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-primary`}></div>
    </div>
  );
};
