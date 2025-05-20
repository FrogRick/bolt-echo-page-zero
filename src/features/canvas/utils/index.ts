
// Exporting all canvas utilities from a single entry point
export * from './line-snapping';
export * from './extension-snapping';
export * from './angle-snapping';
export * from './endpoint-snapping';
export * from './drawShapes';
export * from './previewDrawing';

// Bundle all snapping helpers into a named export
import { findNearestPointOnAnyLine, findClosestPointOnLine, isPointOnLine } from './line-snapping';
import { findLineExtensionPoint } from './extension-snapping';

export const lineSnappingHelpers = {
  findNearestPointOnAnyLine,
  findClosestPointOnLine,
  isPointOnLine,
  findLineExtensionPoint
};
