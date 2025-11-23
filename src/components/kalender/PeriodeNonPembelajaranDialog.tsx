import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodeNonPembelajaranDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (periode: {
    tanggal_mulai: string;
    tanggal_selesai: string;
    nama: string;
    keterangan: string;
    jenis: string;
    id?: string;
  }) => void;
  onDelete?: () => void;
  editingPeriode?: {
    id: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    nama: string;
    keterangan?: string;
    jenis: string;
  } | null;
}

const JENIS_PERIODE = [
  { value: 'ujian', label: 'Ujian' },
  { value: 'libur', label: 'Libur Semester' },
  { value: 'kegiatan', label: 'Kegiatan Sekolah' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function PeriodeNonPembelajaranDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  editingPeriode,
}: PeriodeNonPembelajaranDialogProps) {
  const [tanggalMulai, setTanggalMulai] = useState<Date>();
  const [tanggalSelesai, setTanggalSelesai] = useState<Date>();
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [jenis, setJenis] = useState("ujian");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingPeriode) {
      setTanggalMulai(new Date(editingPeriode.tanggal_mulai));
      setTanggalSelesai(new Date(editingPeriode.tanggal_selesai));
      setNama(editingPeriode.nama);
      setKeterangan(editingPeriode.keterangan || "");
      setJenis(editingPeriode.jenis);
    } else if (open) {
      setTanggalMulai(undefined);
      setTanggalSelesai(undefined);
      setNama("");
      setKeterangan("");
      setJenis("ujian");
    }
  }, [editingPeriode, open]);

  const handleSave = () => {
    if (!tanggalMulai || !tanggalSelesai || !nama) return;

    onSave({
      tanggal_mulai: format(tanggalMulai, "yyyy-MM-dd"),
      tanggal_selesai: format(tanggalSelesai, "yyyy-MM-dd"),
      nama,
      keterangan,
      jenis,
      ...(editingPeriode?.id && { id: editingPeriode.id }),
    });

    handleClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
    handleClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleClose = () => {
    setTanggalMulai(undefined);
    setTanggalSelesai(undefined);
    setNama("");
    setKeterangan("");
    setJenis("ujian");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPeriode ? "Edit Periode" : "Tambah Periode Non-Pembelajaran"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Atur periode dimana tidak ada pembelajaran seperti ujian, libur semester, atau kegiatan khusus lainnya.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Jenis Periode</Label>
            <Select value={jenis} onValueChange={setJenis}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JENIS_PERIODE.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Periode</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Ujian Tengah Semester"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalMulai && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalMulai ? (
                      format(tanggalMulai, "dd MMM yyyy", { locale: idLocale })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalMulai}
                    onSelect={setTanggalMulai}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalSelesai && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalSelesai ? (
                      format(tanggalSelesai, "dd MMM yyyy", { locale: idLocale })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalSelesai}
                    onSelect={setTanggalSelesai}
                    initialFocus
                    disabled={(date) =>
                      tanggalMulai ? date < tanggalMulai : false
                    }
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
            <Textarea
              id="keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tambahkan keterangan jika diperlukan"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          {editingPeriode && onDelete && (
            <Button variant="destructive" onClick={handleDeleteClick} className="mr-auto">
              Hapus
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!tanggalMulai || !tanggalSelesai || !nama}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Periode</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus periode "{editingPeriode?.nama}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
