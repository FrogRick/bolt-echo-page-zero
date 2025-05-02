
import { Button } from "@/components/ui/button";

interface PDFErrorProps {
  error: string;
  onReset: () => void;
}

export const PDFError = ({ error, onReset }: PDFErrorProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
      <div className="text-center p-4">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={onReset}>
          Try Another PDF
        </Button>
      </div>
    </div>
  );
};

