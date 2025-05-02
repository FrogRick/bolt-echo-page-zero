import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";
import { PDFDocument, rgb } from "pdf-lib";
import { Project, EditorSymbol } from "@/types/editor";

export const useEditorActions = (
  project: Project | null,
  symbols: EditorSymbol[],
  pdfFile: File | null,
  saveProject: (project: Project) => void,
  setSymbols: (symbols: EditorSymbol[]) => void,
  setIsSaved: (saved: boolean) => void,
  setPdfFile: (file: File | null) => void
) => {
  const { toast } = useToast();
  const MIN_SCALE = 1.0;
  const MAX_SCALE = 3.0;

  const handlePDFUpload = (file: File | null) => {
    console.log("PDF Upload handler in useEditorActions called:", file?.name);
    
    // Handle case when user cancels the upload or resets
    if (!file) {
      setPdfFile(null);
      return;
    }
    
    // Update application state with the file
    setPdfFile(file);
    
    // Save file data to project if project exists
    if (project) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          console.log("FileReader completed, updating project");
          const updatedProject = {
            ...project,
            pdfData: e.target.result as string,
            updatedAt: new Date()
          };
          saveProject(updatedProject);
          toast({
            title: "PDF uploaded successfully",
            description: `File "${file.name}" has been uploaded.`
          });
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          title: "Upload failed",
          description: "Failed to read the PDF file. Please try again.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSymbolDrop = (type: string, x: number, y: number) => {
    const newSymbol: EditorSymbol = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      rotation: 0,
      size: 30
    };
    const newSymbols = [...symbols, newSymbol];
    setSymbols(newSymbols);
    if (project) {
      saveProject({
        ...project,
        symbols: newSymbols,
        updatedAt: new Date()
      });
    }
  };

  const handleSymbolDragEnd = (symbolId: string, x: number, y: number) => {
    const updatedSymbols = symbols.map(symbol => 
      symbol.id === symbolId ? { ...symbol, x, y } : symbol
    );
    setSymbols(updatedSymbols);
    if (project) {
      saveProject({
        ...project,
        symbols: updatedSymbols,
        updatedAt: new Date()
      });
    }
  };

  const handleDeleteSymbol = (symbolId: string) => {
    const updatedSymbols = symbols.filter(symbol => symbol.id !== symbolId);
    setSymbols(updatedSymbols);
    if (project) {
      saveProject({
        ...project,
        symbols: updatedSymbols,
        updatedAt: new Date()
      });
    }
  };

  const handleSave = () => {
    if (!project) return;
    saveProject({
      ...project,
      symbols,
      updatedAt: new Date()
    });
    setIsSaved(true);
  };

  const handlePrint = async () => {
    if (!pdfFile || !project) {
      toast({
        title: "No PDF to print",
        description: "Please upload a PDF first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        toast({
          title: "PDF error",
          description: "The PDF does not have any pages.",
          variant: "destructive"
        });
        return;
      }

      const pdfContainer = document.querySelector(".pdf-canvas-container");
      if (!pdfContainer) {
        toast({
          title: "PDF error",
          description: "Could not find the PDF container element.",
          variant: "destructive"
        });
        return;
      }

      const firstPage = pages[0];
      const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();
      const containerRect = pdfContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const xScale = pdfWidth / containerWidth;
      const yScale = pdfHeight / containerHeight;

      for (const symbol of symbols) {
        const x = symbol.x * xScale;
        const y = pdfHeight - symbol.y * yScale;
        const symbolSize = 15;

        switch (symbol.type) {
          case 'exit':
            firstPage.drawRectangle({
              x: x - symbolSize / 2,
              y: y - symbolSize / 2,
              width: symbolSize,
              height: symbolSize,
              color: rgb(0, 0.7, 0),
              opacity: 0.9
            });
            break;
          case 'fireExt':
            const triangleSize = symbolSize;
            const topX = x;
            const topY = y + triangleSize / 2;
            const leftX = x - triangleSize / 2;
            const leftY = y - triangleSize / 2;
            const rightX = x + triangleSize / 2;
            const rightY = y - triangleSize / 2;

            firstPage.drawLine({
              start: { x: topX, y: topY },
              end: { x: leftX, y: leftY },
              thickness: 1.5,
              color: rgb(0.8, 0, 0)
            });
            firstPage.drawLine({
              start: { x: leftX, y: leftY },
              end: { x: rightX, y: rightY },
              thickness: 1.5,
              color: rgb(0.8, 0, 0)
            });
            firstPage.drawLine({
              start: { x: rightX, y: rightY },
              end: { x: topX, y: topY },
              thickness: 1.5,
              color: rgb(0.8, 0, 0)
            });
            firstPage.drawRectangle({
              x: leftX,
              y: leftY,
              width: triangleSize,
              height: triangleSize,
              color: rgb(0.8, 0, 0),
              opacity: 0.3
            });
            break;
          case 'fireAlarm':
            firstPage.drawCircle({
              x,
              y,
              size: symbolSize,
              color: rgb(0.8, 0, 0),
              opacity: 0.9
            });
            break;
          case 'firstAid':
            firstPage.drawRectangle({
              x: x - symbolSize / 2,
              y: y - symbolSize / 6,
              width: symbolSize,
              height: symbolSize / 3,
              color: rgb(0, 0, 0.8),
              opacity: 0.9
            });
            firstPage.drawRectangle({
              x: x - symbolSize / 6,
              y: y - symbolSize / 2,
              width: symbolSize / 3,
              height: symbolSize,
              color: rgb(0, 0, 0.8),
              opacity: 0.9
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, `${project.name}-evacuation-plan.pdf`);
      toast({
        title: "PDF generated",
        description: "Your evacuation plan has been generated as a PDF with symbols."
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF generation failed",
        description: "There was an error generating your PDF.",
        variant: "destructive"
      });
    }
  };

  return {
    MIN_SCALE,
    MAX_SCALE,
    handlePDFUpload,
    handleSymbolDrop,
    handleSymbolDragEnd,
    handleDeleteSymbol,
    handleSave,
    handlePrint
  };
};
