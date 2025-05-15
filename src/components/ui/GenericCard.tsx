
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GenericCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  timestamp?: { label: string };
  onClick?: () => void;
  loading?: boolean;
  type: "evacuation-plan" | "building" | "organization" | "template";
}

export function GenericCard({
  title,
  subtitle,
  icon,
  timestamp,
  onClick,
  loading = false,
  type,
}: GenericCardProps) {
  return (
    <Card
      className={`group overflow-hidden transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-primary/20 rounded-xl h-[220px] flex flex-col cursor-pointer relative`}
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <p className="text-white font-medium">Deleting...</p>
          </div>
        </div>
      )}
      <div className="relative flex flex-col items-center justify-center pt-6 pb-2">
        <div className="h-14 w-14 flex items-center justify-center bg-white rounded-lg shadow-sm border border-primary/10 mb-2">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[90%] px-2 text-center group-hover:text-primary transition-colors">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500 truncate max-w-[90%] px-2 text-center">{subtitle}</p>}
      </div>
      <CardContent className="flex-grow flex flex-col justify-end items-center pb-4">
        {timestamp && (
          <div className="text-xs text-gray-500 mt-auto">
            <span className="inline-flex items-center">
              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-1.5"></span>
              {timestamp.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
