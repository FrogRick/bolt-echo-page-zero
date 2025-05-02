
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    cv: any;
    cvLoaded: boolean;
  }
}

interface PDFOpenCVHandlerResult {
  openCVLoaded: boolean;
  isDebugMode: boolean;
  ensureCanvas: () => HTMLCanvasElement;
  ensureDebugCanvas: () => HTMLCanvasElement;
}

export const usePDFOpenCVHandler = (pdfContainerRef: React.RefObject<HTMLDivElement>): PDFOpenCVHandlerResult => {
  const [openCVLoaded, setOpenCVLoaded] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvas = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  // Initialize OpenCV.js - with fix for duplicate registration
  useEffect(() => {
    // Check if OpenCV is already loaded and initialized
    if (window.cvLoaded) {
      console.log('OpenCV.js already loaded and initialized');
      setOpenCVLoaded(true);
      return;
    }
    
    // Check if script tag exists but isn't loaded yet
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (existingScript) {
      console.log('OpenCV.js script already exists, waiting for it to load');
      
      const checkOpenCV = setInterval(() => {
        if (window.cv) {
          clearInterval(checkOpenCV);
          window.cvLoaded = true;
          setOpenCVLoaded(true);
          console.log('OpenCV.js loaded and ready');
        }
      }, 500);
      
      return;
    }

    // Script doesn't exist, create it
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      
      // Set a flag to prevent duplicate initialization
      window.cvLoaded = true;
      setOpenCVLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      toast({
        title: "Error",
        description: "Failed to load OpenCV.js for wall detection"
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Don't remove the script since other components might use it
    };
  }, [toast]);

  // Create a canvas when needed
  const ensureCanvas = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 300;
      canvasRef.current.height = 300;
    }
    return canvasRef.current;
  };
  
  // Create or get a debug canvas for visualization
  const ensureDebugCanvas = () => {
    if (!debugCanvas.current) {
      debugCanvas.current = document.createElement('canvas');
      debugCanvas.current.width = 1000;
      debugCanvas.current.height = 1000;
      debugCanvas.current.style.position = 'absolute';
      debugCanvas.current.style.top = '120px';
      debugCanvas.current.style.right = '20px';
      debugCanvas.current.style.zIndex = '10000';
      debugCanvas.current.style.border = '1px solid red';
      debugCanvas.current.style.background = 'white';
      debugCanvas.current.style.display = isDebugMode ? 'block' : 'none';
      
      if (pdfContainerRef.current) {
        pdfContainerRef.current.appendChild(debugCanvas.current);
      }
    }
    return debugCanvas.current;
  };

  // Toggle debug mode with keyboard shortcut (Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsDebugMode(prev => !prev);
        
        // Toggle debug canvas visibility
        if (debugCanvas.current) {
          debugCanvas.current.style.display = !isDebugMode ? 'block' : 'none';
        }
        
        console.log(`Debug mode ${!isDebugMode ? 'enabled' : 'disabled'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDebugMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debugCanvas.current && pdfContainerRef.current) {
        try {
          pdfContainerRef.current.removeChild(debugCanvas.current);
        } catch (e) {
          // Element might have been removed already
        }
      }
    };
  }, [pdfContainerRef]);

  return {
    openCVLoaded,
    isDebugMode,
    ensureCanvas,
    ensureDebugCanvas
  };
};
