
// Canvas utility functions and constants

// A3 size in mm (ISO A series)
export const A3_SIZE = { width: 297, height: 420 };

// Dynamic scaling factor that will be adjusted based on viewport
export const INITIAL_SCALE_FACTOR = 2.5;

/**
 * Calculate the appropriate scale factor based on container and orientation
 */
export const calculateScaleFactor = (
  containerRef: React.RefObject<HTMLDivElement>,
  orientation: "portrait" | "landscape"
): number => {
  if (!containerRef.current) return INITIAL_SCALE_FACTOR;
  
  const containerWidth = containerRef.current.clientWidth - 32; // Subtract padding
  const containerHeight = containerRef.current.clientHeight - 20; // Reduced padding
  
  let width = A3_SIZE.width;
  let height = A3_SIZE.height;
  
  if (orientation === "landscape") {
    width = A3_SIZE.height;
    height = A3_SIZE.width;
  }
  
  // Calculate scaling factors for width and height
  const widthScale = containerWidth / width;
  const heightScale = containerHeight / height;
  
  // Use the smaller scale to ensure the canvas fits within container
  const newScaleFactor = Math.min(widthScale, heightScale) * 0.95; // 95% of available space
  
  return Math.max(1, Math.min(newScaleFactor, 4)); // Limit between 1 and 4
};

/**
 * Update canvas size based on orientation and scale factor
 */
export const calculateCanvasSize = (
  orientation: "portrait" | "landscape",
  scale: number
): { width: number; height: number } => {
  if (orientation === "portrait") {
    return {
      width: Math.round(A3_SIZE.width * scale),
      height: Math.round(A3_SIZE.height * scale)
    };
  } else {
    return {
      width: Math.round(A3_SIZE.height * scale),
      height: Math.round(A3_SIZE.width * scale)
    };
  }
};
