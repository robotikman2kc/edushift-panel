import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localDB, Ekstrakurikuler } from "@/lib/localDB";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function KelolaEkstrakurikuler() {
  const [ekstrakurikulers, setEkstrakurikulers] = useState<Ekstrakurikuler[]>(
    localDB.select('ekstrakurikuler')
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEskul, setEditingEskul] = useState<Ekstrakurikuler | null>(null);
  const [formData, setFormData] = useState({
    nama_eskul: "",
    pembimbing: "",
    hari_pertemuan: "",
    jam_pertemuan: "",
    deskripsi: "",
    status: "aktif"
  });

  const loadData = () => {
    setEkstrakurikulers(localDB.select('ekstrakurikuler'));
  };

  const handleOpenDialog = (eskul?: Ekstrakurikuler) => {
    if (eskul) {
      setEditingEskul(eskul);
      setFormData({
        nama_eskul: eskul.nama_eskul,
        pembimbing: eskul.pembimbing,
        hari_pertemuan: eskul.hari_pertemuan,
        jam_pertemuan: eskul.jam_pertemuan,
        deskripsi: eskul.deskripsi || "",
        status: eskul.status
      });
    } else {
      setEditingEskul(null);
      setFormData({
        nama_eskul: "",
        pembimbing: "",
        hari_pertemuan: "",
        jam_pertemuan: "",
        deskripsi: "",
        status: "aktif"
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nama_eskul || !formData.pembimbing || !formData.hari_pertemuan || !formData.jam_pertemuan) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (editingEskul) {
      const result = localDB.update('ekstrakurikuler', editingEskul.id, formData);
      if (result.error) {
        toast.error("Gagal mengupdate ekstrakurikuler");
      } else {
        toast.success("Ekstrakurikuler berhasil diupdate");
        loadData();
        setDialogOpen(false);
      }
    } else {
      const result = localDB.insert('ekstrakurikuler', formData);
      if (result.error) {
        toast.error("Gagal menambahkan ekstrakurikuler");
      } else {
        toast.success("Ekstrakurikuler berhasil ditambahkan");
        loadData();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus ekstrakurikuler ini?")) {
      const result = localDB.delete('ekstrakurikuler', id);
      if (result.error) {
        toast.error("Gagal menghapus ekstrakurikuler");
      } else {
        toast.success("Ekstrakurikuler berhasil dihapus");
        loadData();
      }
    }
  };

  const columns = [
    {
      key: "nama_eskul",
      label: "Nama Ekstrakurikuler"
    },
    {
      key: "pembimbing",
      label: "Pembimbing"
    },
    {
      key: "jadwal",
      label: "Jadwal"
    },
    {
      key: "status",
      label: "Status"
    },
    {
      key: "actions",
      label: "Aksi"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Ekstrakurikuler"
        description="Kelola data ekstrakurikuler sekolah"
      >
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Ekstrakurikuler
        </Button>
      </PageHeader>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ekstrakurikulers.map((eskul) => (
              <TableRow key={eskul.id}>
                <TableCell>{eskul.nama_eskul}</TableCell>
                <TableCell>{eskul.pembimbing}</TableCell>
                <TableCell>{eskul.hari_pertemuan}, {eskul.jam_pertemuan}</TableCell>
                <TableCell>
                  <Badge variant={eskul.status === "aktif" ? "default" : "secondary"}>
                    {eskul.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(eskul)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(eskul.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEskul ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"}
            </DialogTitle>
            <DialogDescription>
              Isi informasi ekstrakurikuler di bawah ini
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nama_eskul">Nama Ekstrakurikuler *</Label>
              <Input
                id="nama_eskul"
                value={formData.nama_eskul}
                onChange={(e) => setFormData({ ...formData, nama_eskul: e.target.value })}
                placeholder="Contoh: Pramuka"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pembimbing">Nama Pembimbing *</Label>
              <Input
                id="pembimbing"
                value={formData.pembimbing}
                onChange={(e) => setFormData({ ...formData, pembimbing: e.target.value })}
                placeholder="Nama pembimbing ekstrakurikuler"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hari_pertemuan">Hari Pertemuan *</Label>
                <Select
                  value={formData.hari_pertemuan}
                  onValueChange={(value) => setFormData({ ...formData, hari_pertemuan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_OPTIONS.map((hari) => (
                      <SelectItem key={hari} value={hari}>
                        {hari}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="jam_pertemuan">Jam Pertemuan *</Label>
                <Input
                  id="jam_pertemuan"
                  type="time"
                  value={formData.jam_pertemuan}
                  onChange={(e) => setFormData({ ...formData, jam_pertemuan: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Deskripsi ekstrakurikuler"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingEskul ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
