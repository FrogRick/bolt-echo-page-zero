
// Re-export hooks from shadcn/ui toast component
import { useToast as useShadcnToast } from "@/components/ui/toast";
import { toast as shadcnToast } from "@/components/ui/toast";

// Export with the same names for consistency
export const useToast = useShadcnToast;
export const toast = shadcnToast;
