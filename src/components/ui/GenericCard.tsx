
import { ReactNode, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MoreVertical, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Unified interface that works for all card types
interface GenericCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  timestamp?: { label: string };
  onClick?: () => void;
  loading?: boolean;
  type: string; // Changed to string to allow for more flexibility
  id?: string;
  onDelete?: () => void;
}

export function GenericCard({
  title,
  subtitle,
  icon,
  timestamp,
  onClick,
  loading = false,
  type,
  id,
  onDelete
}: GenericCardProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  
  return (
    <ContextMenu onOpenChange={setShowContextMenu}>
      <ContextMenuTrigger>
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
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                  }}
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative flex flex-col items-center justify-center pt-6 pb-2">
            <div className="h-14 w-14 flex items-center justify-center bg-white rounded-lg shadow-sm border border-primary/10 mb-2">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>}
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onDelete && (
          <ContextMenuItem 
            className="text-red-600 focus:text-red-600 focus:bg-red-50" 
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
