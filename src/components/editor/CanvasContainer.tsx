import React from "react";

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: { width: number; height: number };
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  endDrawing: () => void;
  onDoubleClick?: () => void;
  activeTool: string;
  underlayImage: HTMLImageElement | null;
  containerRef: React.RefObject<HTMLDivElement>;
  underlayRect: { x: number; y: number; width: number; height: number } | null;
  handleUnderlayRectClick: () => void;
  resizingUnderlayRect: boolean;
  startResizingUnderlayRect: (corner: string, e: React.MouseEvent) => void;
  movingUnderlayRect: boolean;
  startMovingUnderlayRect: (e: React.MouseEvent) => void;
  confirmImagePlacement: () => void;
  removeUnderlayImage: () => void;
  imageConfirmed: boolean;
  reactivateImagePositioning: () => void;
  underlayOpacity: number;
  adjustUnderlayOpacity: (opacity: number) => void;
  fillOpacity: number;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  canvasRef,
  canvasSize,
  startDrawing,
  draw,
  endDrawing,
  onDoubleClick,
  activeTool,
  underlayImage,
  containerRef,
  underlayRect,
  handleUnderlayRectClick,
  resizingUnderlayRect,
  startResizingUnderlayRect,
  movingUnderlayRect,
  startMovingUnderlayRect,
  confirmImagePlacement,
  removeUnderlayImage,
  imageConfirmed,
  reactivateImagePositioning,
  underlayOpacity,
  adjustUnderlayOpacity,
  fillOpacity,
}) => {
  
  return (
    <div 
      className="flex-1 overflow-hidden bg-gray-50 relative"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <div className="flex items-center justify-center w-full h-full p-4">
        <div className="relative bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Underlay Image */}
          {underlayImage && underlayRect && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute"
                style={{
                  left: `${underlayRect.x}px`,
                  top: `${underlayRect.y}px`,
                  width: `${underlayRect.width}px`,
                  height: `${underlayRect.height}px`,
                  opacity: underlayOpacity,
                  zIndex: 1,
                }}
              >
                <img
                  src={underlayImage.src}
                  alt="Underlay"
                  className="w-full h-full object-cover"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: `opacity(${underlayOpacity})`
                  }}
                />
              </div>
            </div>
          )}

          {/* Underlay Rectangle Controls */}
          {underlayRect && (!imageConfirmed || !underlayImage) && (
            <div className="absolute inset-0" style={{ zIndex: 10 }}>
              {/* Rectangle outline */}
              <div
                className="absolute border-2 border-dashed border-blue-400 cursor-pointer bg-blue-50"
                style={{
                  left: `${underlayRect.x}px`,
                  top: `${underlayRect.y}px`,
                  width: `${underlayRect.width}px`,
                  height: `${underlayRect.height}px`,
                  opacity: fillOpacity / 100,
                }}
                onClick={handleUnderlayRectClick}
                onMouseDown={startMovingUnderlayRect}
              >
                {/* Resize handles */}
                {!movingUnderlayRect && (
                  <>
                    {/* Corner handles */}
                    <div
                      className="absolute w-3 h-3 bg-blue-500 cursor-nw-resize -top-1 -left-1"
                      onMouseDown={(e) => startResizingUnderlayRect('nw', e)}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 cursor-ne-resize -top-1 -right-1"
                      onMouseDown={(e) => startResizingUnderlayRect('ne', e)}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 cursor-se-resize -bottom-1 -right-1"
                      onMouseDown={(e) => startResizingUnderlayRect('se', e)}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-500 cursor-sw-resize -bottom-1 -left-1"
                      onMouseDown={(e) => startResizingUnderlayRect('sw', e)}
                    />
                  </>
                )}

                {/* Placeholder content */}
                <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-medium pointer-events-none">
                  {underlayImage ? "Position & resize image" : "Click to upload image"}
                </div>
              </div>

              {/* Action buttons */}
              {underlayImage && (
                <div className="absolute flex gap-2 z-20" style={{
                  left: `${underlayRect.x + underlayRect.width + 10}px`,
                  top: `${underlayRect.y}px`
                }}>
                  <button
                    onClick={confirmImagePlacement}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={removeUnderlayImage}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    ✗ Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Confirmed image repositioning button */}
          {imageConfirmed && underlayImage && (
            <div className="absolute top-2 right-2 z-20">
              <button
                onClick={reactivateImagePositioning}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              >
                Reposition
              </button>
            </div>
          )}

          {/* Main Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="block cursor-crosshair"
            style={{ zIndex: 5 }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onDoubleClick={onDoubleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default CanvasContainer;
