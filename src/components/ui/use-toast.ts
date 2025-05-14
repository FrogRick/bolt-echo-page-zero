
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast as toastFunction } from "@/hooks/use-toast";

// Export the hooks from our custom implementation
export const useToast = useToastHook;
export const toast = toastFunction;
