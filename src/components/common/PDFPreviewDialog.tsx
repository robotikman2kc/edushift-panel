import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  filename: string;
}

export const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({
  open,
  onOpenChange,
  pdfBlob,
  filename,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Cleanup URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfBlob]);

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col" aria-describedby="pdf-preview-description">
        <DialogHeader>
          <DialogTitle>Preview PDF - {filename}</DialogTitle>
          <p id="pdf-preview-description" className="sr-only">
            Dialog untuk preview PDF sebelum diunduh atau dicetak
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              className="w-full h-full"
              title="PDF Preview"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <p className="text-muted-foreground">
                Memuat preview PDF...
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </Button>
            
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Unduh
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
