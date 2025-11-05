import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CalendarNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (judul: string, deskripsi: string) => void;
  selectedDate: Date | null;
}

export function CalendarNoteDialog({ open, onOpenChange, onSave, selectedDate }: CalendarNoteDialogProps) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const handleSave = () => {
    if (judul.trim() && deskripsi.trim()) {
      onSave(judul, deskripsi);
      setJudul("");
      setDeskripsi("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setJudul("");
    setDeskripsi("");
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
            <Label htmlFor="judul">Judul Kegiatan</Label>
            <Input
              id="judul"
              placeholder="Masukkan judul kegiatan"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder="Masukkan deskripsi kegiatan"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!judul.trim() || !deskripsi.trim()}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
