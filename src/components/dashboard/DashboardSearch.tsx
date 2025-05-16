
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({
  value,
  onChange,
  placeholder = "Search..."
}) => {
  return (
    <div className="relative w-full md:max-w-md mb-6">
      <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 bg-background border border-input rounded-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
