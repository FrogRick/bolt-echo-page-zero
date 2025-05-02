import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { File, Copy, Replace, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProjectPDF, EditorSymbol } from "@/types/editor";
import { useToast } from "@/hooks/use-toast";

// DuplicatePDFButton component
export const DuplicatePDFButton = ({ 
  pdfData, 
  onDuplicate,
  disabled = false
}: { 
  pdfData: { id: string; name: string; data: string }; 
  onDuplicate: (originalId: string, newName: string) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(`${pdfData.name} - Copy`);
  const { toast } = useToast();

  const handleDuplicate = () => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the duplicate PDF",
        variant: "destructive"
      });
      return;
    }

    onDuplicate(pdfData.id, newName);
    setOpen(false);
    toast({
      title: "PDF duplicated",
      description: `"${pdfData.name}" has been duplicated as "${newName}".`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          disabled={disabled}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate PDF</DialogTitle>
          <DialogDescription>
            Create a duplicate of "{pdfData.name}" with all symbols and walls.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">New PDF name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name for the duplicate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleDuplicate}>Duplicate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ReplacePDFButton component
export const ReplacePDFButton = ({ 
  pdfData, 
  onReplace,
  disabled = false
}: { 
  pdfData: { id: string; name: string; }; 
  onReplace: (pdfId: string, newFile: File) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Only PDF files are supported.",
          variant: "destructive"
        });
        return;
      }
      
      onReplace(pdfData.id, file);
      setOpen(false);
      toast({
        title: "PDF replaced",
        description: `"${pdfData.name}" has been replaced with "${file.name}".`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          disabled={disabled}
        >
          <Replace className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace PDF</DialogTitle>
          <DialogDescription>
            Replace "{pdfData.name}" with a new PDF while keeping all symbols and walls.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Select new PDF</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <File className="mr-2 h-4 w-4" /> Select PDF file
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// PDF Manager component
export const PDFManager = ({
  pdfs,
  onAddPDF,
  onDeletePDF,
  onRenamePDF,
  onSelectPDF,
  onClose,
  selectedPdfId
}: {
  pdfs: ProjectPDF[];
  onAddPDF: (name: string, file: File) => void;
  onDeletePDF: (pdfId: string) => void;
  onRenamePDF: (pdfId: string, newName: string) => void;
  onSelectPDF: (pdf: ProjectPDF) => void;
  onClose: () => void;
  selectedPdfId?: string;
}) => {
  const [showAddPDF, setShowAddPDF] = useState(false);
  const [newPDFName, setNewPDFName] = useState("");
  const [newPDFFile, setNewPDFFile] = useState<File | null>(null);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editingPdfName, setEditingPdfName] = useState("");
  const { toast } = useToast();
  
  const handleAddPDF = () => {
    if (!newPDFName || !newPDFFile) {
      toast({
        title: "Error",
        description: "Please provide a name and select a PDF file",
        variant: "destructive"
      });
      return;
    }
    
    onAddPDF(newPDFName, newPDFFile);
    setNewPDFName("");
    setNewPDFFile(null);
    setShowAddPDF(false);
  };
  
  const handleEditPDF = () => {
    if (!editingPdfId || !editingPdfName) {
      toast({
        title: "Error",
        description: "Please provide a name",
        variant: "destructive"
      });
      return;
    }
    
    onRenamePDF(editingPdfId, editingPdfName);
    setEditingPdfId(null);
    setEditingPdfName("");
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Only PDF files are supported",
          variant: "destructive"
        });
        return;
      }
      setNewPDFFile(file);
    }
  };
  
  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Floor Plans</DialogTitle>
          <DialogDescription>
            Add, rename, or delete floor plans for your project.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto py-2">
          {pdfs.map((pdf) => (
            <div key={pdf.id} className="flex items-center justify-between p-2 border rounded-md">
              {editingPdfId === pdf.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input 
                    value={editingPdfName} 
                    onChange={(e) => setEditingPdfName(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => setEditingPdfId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEditPDF}>Save</Button>
                </div>
              ) : (
                <>
                  <div 
                    className={`flex-1 cursor-pointer p-1 ${selectedPdfId === pdf.id ? 'font-semibold' : ''}`}
                    onClick={() => onSelectPDF(pdf)}
                  >
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      {pdf.name}
                      {selectedPdfId === pdf.id && <Check className="h-4 w-4 ml-1" />}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingPdfId(pdf.id);
                        setEditingPdfName(pdf.name);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDeletePDF(pdf.id)}
                      disabled={pdfs.length === 1}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {showAddPDF ? (
          <div className="space-y-2 py-2 border-t">
            <div>
              <Label htmlFor="pdf-name">Floor Plan Name</Label>
              <Input 
                id="pdf-name" 
                value={newPDFName} 
                onChange={(e) => setNewPDFName(e.target.value)}
                placeholder="Enter name for this floor plan"
              />
            </div>
            <div>
              <Label htmlFor="pdf-file">PDF File</Label>
              <Input 
                id="pdf-file" 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddPDF(false)}>Cancel</Button>
              <Button onClick={handleAddPDF}>Add Floor Plan</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowAddPDF(true)} className="w-full">
            Add Floor Plan
          </Button>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFManager;
