
import React from "react";
import { WorkflowStage } from "./WorkflowSteps";

interface ToolbarProps {
  onActiveSymbolChange: (symbolType: string) => void;
  onDrawingModeToggle: (active: boolean) => void;
  onSimilarityModeToggle: (active: boolean) => void;
  onLayersChange: (layers: string[]) => void;
  onWallThicknessChange: (thickness: number) => void;
  onSnapToAngleToggle: (active: boolean) => void;
  onSnapToWallsToggle: (active: boolean) => void;
  onUseManualWallsToggle: (active: boolean) => void;
  isDrawingModeActive: boolean;
  isSimilarityModeActive: boolean;
  activeLayers: string[];
  currentWallThickness: number;
  isSnapToAngleActive: boolean;
  isSnapToWallsActive: boolean;
  isManualWallsActive: boolean;
  currentStage: WorkflowStage;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onActiveSymbolChange,
  onDrawingModeToggle,
  onSimilarityModeToggle,
  onLayersChange,
  onWallThicknessChange,
  onSnapToAngleToggle,
  onSnapToWallsToggle,
  onUseManualWallsToggle,
  isDrawingModeActive,
  isSimilarityModeActive,
  activeLayers,
  currentWallThickness,
  isSnapToAngleActive,
  isSnapToWallsActive,
  isManualWallsActive,
  currentStage
}) => {
  return (
    <div className="w-64 bg-white border-r p-4">
      <h3 className="font-semibold mb-4">Tools</h3>
      
      {/* Show different tools based on current stage */}
      {currentStage === 'draw_walls' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Wall Drawing</h4>
            <button 
              className={`px-3 py-1.5 rounded text-sm ${isDrawingModeActive ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              onClick={() => onDrawingModeToggle(!isDrawingModeActive)}
            >
              {isDrawingModeActive ? 'Exit Drawing Mode' : 'Start Drawing'}
            </button>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Wall Thickness</h4>
            <input 
              type="range"
              min="1"
              max="10"
              value={currentWallThickness}
              onChange={(e) => onWallThicknessChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{currentWallThickness}px</div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Snap Options</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={isSnapToAngleActive}
                  onChange={() => onSnapToAngleToggle(!isSnapToAngleActive)}
                />
                <span className="text-sm">Snap to 45° angles</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={isSnapToWallsActive}
                  onChange={() => onSnapToWallsToggle(!isSnapToWallsActive)}
                />
                <span className="text-sm">Snap to walls</span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      {currentStage === 'add_doors' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Door Types</h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('door_single')}
            >
              Single Door
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('door_double')}
            >
              Double Door
            </button>
          </div>
        </div>
      )}
      
      {currentStage === 'add_windows' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Window Types</h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('window_single')}
            >
              Standard Window
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('window_large')}
            >
              Large Window
            </button>
          </div>
        </div>
      )}
      
      {currentStage === 'add_furniture' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Furniture</h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('desk')}
            >
              Desk
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('chair')}
            >
              Chair
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('table')}
            >
              Table
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('sofa')}
            >
              Sofa
            </button>
          </div>
        </div>
      )}
      
      {currentStage === 'add_safety' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Safety Equipment</h4>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('fire_extinguisher')}
            >
              Fire Extinguisher
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('emergency_exit')}
            >
              Emergency Exit
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('fire_alarm')}
            >
              Fire Alarm
            </button>
            <button 
              className="p-2 border rounded text-center text-sm hover:bg-gray-50"
              onClick={() => onActiveSymbolChange('first_aid')}
            >
              First Aid
            </button>
          </div>
        </div>
      )}
      
      {currentStage === 'export' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Export Options</h4>
          <button 
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
            onClick={() => console.log("Exporting...")}
          >
            Generate PDF
          </button>
        </div>
      )}
    </div>
  );
};
