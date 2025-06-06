
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 text-center bg-background border border-input rounded-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
