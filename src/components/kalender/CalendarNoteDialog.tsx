import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CalendarNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (catatan: string, noteId?: string) => void;
  onDelete?: (noteId: string) => void;
  selectedDate: Date | null;
  editingNote?: { id: string; catatan: string } | null;
}

export function CalendarNoteDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  selectedDate,
  editingNote 
}: CalendarNoteDialogProps) {
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (editingNote) {
      setCatatan(editingNote.catatan);
    } else {
      setCatatan("");
    }
  }, [editingNote, open]);

  const handleSave = () => {
    if (catatan.trim()) {
      onSave(catatan, editingNote?.id);
      setCatatan("");
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (editingNote && onDelete) {
      onDelete(editingNote.id);
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
          <DialogTitle>
            {editingNote ? "Edit Catatan Kegiatan" : "Tambah Catatan Kegiatan"}
          </DialogTitle>
          <DialogDescription>
            {editingNote ? "Ubah" : "Tambahkan"} catatan kegiatan untuk tanggal {selectedDate?.toLocaleDateString('id-ID', { 
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
        <DialogFooter className="gap-2">
          {editingNote && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              Hapus
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!catatan.trim()}>
            {editingNote ? "Update" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
