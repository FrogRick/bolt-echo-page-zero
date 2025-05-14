
import { toast as sonnerToast, type ToastT } from "sonner";
import {
  useToast as useHookToast,
} from "@/components/ui/use-toast";

// Re-export the hooks from the UI components
export const useToast = useHookToast;

// Create a toast function that wraps sonner toast for consistency
interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

export const toast = ({
  title,
  description,
  variant = "default",
  duration,
  ...props
}: ToastProps) => {
  const options: Parameters<typeof sonnerToast.error>[1] = {
    duration,
    ...props,
  };

  // Map our variant to sonner's types
  switch (variant) {
    case "destructive":
      return sonnerToast.error(title, {
        description,
        ...options,
      });
    case "success":
      return sonnerToast.success(title, {
        description,
        ...options,
      });
    default:
      return sonnerToast(title, {
        description,
        ...options,
      });
  }
};
