
import { Point } from '../types/canvas';

// Function to snap angle to nearest 45 degrees if within threshold
export const snapAngleToGrid = (startPoint: Point, endPoint: Point, snapToAngle: boolean = true): Point => {
  if (!snapToAngle) return endPoint;

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  
  // Calculate angle in radians and convert to degrees
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Determine nearest 45 degree increment
  const snapAngle = Math.round(angle / 45) * 45;
  
  // Check if we're within the threshold (5 degrees) of a 45-degree increment - stricter threshold
  const angleDiff = Math.abs((angle % 45) - 45) % 45;
  const shouldSnap = angleDiff < 5 || angleDiff > 40; // Much stricter threshold - within 5 degrees of a 45 degree angle
  
  if (!shouldSnap) return endPoint;
  
  // Convert back to radians
  const snapRadians = snapAngle * (Math.PI / 180);
  
  // Calculate distance
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate new endpoint
  return {
    x: startPoint.x + distance * Math.cos(snapRadians),
    y: startPoint.y + distance * Math.sin(snapRadians)
  };
};
