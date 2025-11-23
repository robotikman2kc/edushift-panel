import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CalendarNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (catatan: string, warna: string, noteId?: string) => void;
  onDelete?: (noteId: string) => void;
  selectedDate: Date | null;
  editingNote?: { id: string; catatan: string; warna?: string } | null;
}

const COLORS = [
  { name: "Biru", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Hijau", value: "bg-green-500", border: "border-green-500" },
  { name: "Kuning", value: "bg-yellow-500", border: "border-yellow-500" },
  { name: "Merah", value: "bg-red-500", border: "border-red-500" },
  { name: "Ungu", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Pink", value: "bg-pink-500", border: "border-pink-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
  { name: "Cyan", value: "bg-cyan-500", border: "border-cyan-500" },
];

export function CalendarNoteDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  selectedDate,
  editingNote 
}: CalendarNoteDialogProps) {
  const [catatan, setCatatan] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  useEffect(() => {
    if (editingNote) {
      setCatatan(editingNote.catatan);
      setSelectedColor(editingNote.warna || COLORS[0].value);
    } else {
      setCatatan("");
      setSelectedColor(COLORS[0].value);
    }
  }, [editingNote, open]);

  const handleSave = () => {
    if (catatan.trim()) {
      onSave(catatan, selectedColor, editingNote?.id);
      setCatatan("");
      setSelectedColor(COLORS[0].value);
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
    setSelectedColor(COLORS[0].value);
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
          
          <div className="space-y-2">
            <Label>Pilih Warna</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "h-12 rounded-md transition-transform duration-200",
                    color.value,
                    selectedColor === color.value 
                      ? `ring-2 ring-offset-2 ring-primary scale-105`
                      : "hover:scale-105"
                  )}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Warna ini akan ditampilkan di kalender untuk tanggal tersebut
            </p>
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
