
import React from "react";
import { ProjectPDF, Project } from "@/types/editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, FileText, Save } from "lucide-react";
import { PDFManager, DuplicatePDFButton, ReplacePDFButton } from "./PDFManager";

interface TopMenuProps {
  project: Project;
  isSaved: boolean;
  onSave: () => void;
  onPrint: () => void;
  pdfs: ProjectPDF[];
  onPDFAdd: (name: string, file: File) => void;
  onPDFDelete: (pdfId: string) => void;
  onPDFSelect: (pdf: ProjectPDF) => void;
  onPDFRename: (pdfId: string, newName: string) => void;
  selectedPdfId?: string;
  currentStage?: string;
  renderSelectedPDF?: () => React.ReactNode;
}

export const TopMenu = ({
  project,
  isSaved,
  onSave,
  onPrint,
  pdfs,
  onPDFAdd,
  onPDFDelete,
  onPDFSelect,
  onPDFRename,
  selectedPdfId,
  currentStage,
  renderSelectedPDF
}: TopMenuProps) => {
  const [showPDFManager, setShowPDFManager] = React.useState(false);
  
  return (
    <Card className="mb-4 relative z-[100]">
      <CardContent className="p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">{project.name}</div>
            
            {/* PDF selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[200px] overflow-hidden text-ellipsis">
                  {renderSelectedPDF ? (
                    renderSelectedPDF()
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {selectedPdfId && pdfs.length > 0
                          ? pdfs.find(p => p.id === selectedPdfId)?.name || "Choose a floor plan"
                          : "Choose a floor plan"}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white">
                <DropdownMenuGroup>
                  {pdfs.map((pdf) => (
                    <DropdownMenuItem 
                      key={pdf.id}
                      onClick={() => onPDFSelect(pdf)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="truncate">{pdf.name}</span>
                        {selectedPdfId === pdf.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPDFManager(true)} className="cursor-pointer">
                  Manage floor plans
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PDF Manager dialog */}
            {showPDFManager && (
              <PDFManager 
                pdfs={pdfs}
                onAddPDF={onPDFAdd}
                onDeletePDF={onPDFDelete}
                onRenamePDF={onPDFRename}
                onSelectPDF={onPDFSelect}
                onClose={() => setShowPDFManager(false)}
                selectedPdfId={selectedPdfId}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save
              {!isSaved && <span className="h-2 w-2 bg-orange-500 rounded-full"></span>}
            </Button>
            
            {currentStage === "review" || currentStage === "export" ? (
              <Button onClick={onPrint}>Export</Button>
            ) : (
              <Button onClick={onPrint}>Preview</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
