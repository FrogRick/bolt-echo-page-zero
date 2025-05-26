import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DownloadPDFButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  orientation: "portrait" | "landscape";
  canvasSize: { width: number; height: number };
}

export const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({ 
  canvasRef, 
  orientation,
  canvasSize
}) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!canvasRef.current) {
      toast({
        title: "Error",
        description: "Canvas not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your PDF...",
      });

      // Create a new canvas to render everything together
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // First, fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the canvas content
      ctx.drawImage(canvasRef.current, 0, 0);

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');

      // Create PDF with correct orientation
      const pdf = new jsPDF({
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate aspect ratio to fit the canvas into the PDF
      const canvasAspect = canvas.width / canvas.height;
      const pdfAspect = pdfWidth / pdfHeight;

      let imgWidth, imgHeight;

      if (canvasAspect > pdfAspect) {
        // Canvas is wider than PDF
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / canvasAspect;
      } else {
        // Canvas is taller than PDF
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * canvasAspect;
      }

      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Save the PDF
      pdf.save('evacuation-plan.pdf');

      toast({
        title: "PDF Downloaded",
        description: "Your evacuation plan has been downloaded as a PDF.",
        variant: "success"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      className="bg-primary hover:bg-primary/90 text-white shadow-lg"
    >
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
};