import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CalendarNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (catatan: string) => void;
  selectedDate: Date | null;
}

export function CalendarNoteDialog({ open, onOpenChange, onSave, selectedDate }: CalendarNoteDialogProps) {
  const [catatan, setCatatan] = useState("");

  const handleSave = () => {
    if (catatan.trim()) {
      onSave(catatan);
      setCatatan("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setCatatan("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Catatan Kegiatan</DialogTitle>
          <DialogDescription>
            Tambahkan catatan kegiatan untuk tanggal {selectedDate?.toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Kegiatan</Label>
            <Textarea
              id="catatan"
              placeholder="Masukkan catatan kegiatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!catatan.trim()}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
