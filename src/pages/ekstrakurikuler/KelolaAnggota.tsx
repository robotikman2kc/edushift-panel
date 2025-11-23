import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localDB, AnggotaEskul, Ekstrakurikuler } from "@/lib/localDB";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function KelolaAnggota() {
  const [anggota, setAnggota] = useState<AnggotaEskul[]>(
    localDB.select('anggota_eskul')
  );
  const [ekstrakurikulers] = useState<Ekstrakurikuler[]>(
    localDB.select('ekstrakurikuler', (e: Ekstrakurikuler) => e.status === 'aktif')
  );
  const [selectedEskul, setSelectedEskul] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<AnggotaEskul | null>(null);
  const [formData, setFormData] = useState({
    ekstrakurikuler_id: "",
    nisn: "",
    nama_siswa: "",
    tingkat: "",
    nama_kelas: "",
    tanggal_masuk: new Date().toISOString().split('T')[0],
    status: "aktif"
  });

  const loadData = () => {
    setAnggota(localDB.select('anggota_eskul'));
  };

  const handleOpenDialog = (anggota?: AnggotaEskul) => {
    if (anggota) {
      setEditingAnggota(anggota);
      setFormData({
        ekstrakurikuler_id: anggota.ekstrakurikuler_id,
        nisn: anggota.nisn,
        nama_siswa: anggota.nama_siswa,
        tingkat: anggota.tingkat,
        nama_kelas: anggota.nama_kelas,
        tanggal_masuk: anggota.tanggal_masuk,
        status: anggota.status
      });
    } else {
      setEditingAnggota(null);
      setFormData({
        ekstrakurikuler_id: selectedEskul,
        nisn: "",
        nama_siswa: "",
        tingkat: "",
        nama_kelas: "",
        tanggal_masuk: new Date().toISOString().split('T')[0],
        status: "aktif"
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.ekstrakurikuler_id || !formData.nisn || !formData.nama_siswa || !formData.tingkat || !formData.nama_kelas) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (editingAnggota) {
      const result = localDB.update('anggota_eskul', editingAnggota.id, formData);
      if (result.error) {
        toast.error("Gagal mengupdate anggota");
      } else {
        toast.success("Anggota berhasil diupdate");
        loadData();
        setDialogOpen(false);
      }
    } else {
      const result = localDB.insert('anggota_eskul', formData);
      if (result.error) {
        toast.error("Gagal menambahkan anggota");
      } else {
        toast.success("Anggota berhasil ditambahkan");
        loadData();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
      const result = localDB.delete('anggota_eskul', id);
      if (result.error) {
        toast.error("Gagal menghapus anggota");
      } else {
        toast.success("Anggota berhasil dihapus");
        loadData();
      }
    }
  };

  const getEskulName = (id: string) => {
    const eskul = ekstrakurikulers.find(e => e.id === id);
    return eskul ? eskul.nama_eskul : "-";
  };

  const filteredAnggota = selectedEskul 
    ? anggota.filter(a => a.ekstrakurikuler_id === selectedEskul)
    : anggota;

  const columns = [
    {
      key: "nisn",
      label: "NISN"
    },
    {
      key: "nama_siswa",
      label: "Nama Siswa"
    },
    {
      key: "tingkat",
      label: "Tingkat"
    },
    {
      key: "nama_kelas",
      label: "Kelas"
    },
    {
      key: "ekstrakurikuler",
      label: "Ekstrakurikuler"
    },
    {
      key: "tanggal_masuk",
      label: "Tanggal Masuk"
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
        title="Kelola Anggota Ekstrakurikuler"
        description="Kelola data anggota ekstrakurikuler"
      >
        <Button onClick={() => handleOpenDialog()} disabled={!selectedEskul}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggota
        </Button>
      </PageHeader>

      <Card className="p-6">
        <div className="mb-4">
          <Label htmlFor="filter-eskul">Filter Ekstrakurikuler</Label>
          <Select value={selectedEskul} onValueChange={setSelectedEskul}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Semua Ekstrakurikuler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Ekstrakurikuler</SelectItem>
              {ekstrakurikulers.map((eskul) => (
                <SelectItem key={eskul.id} value={eskul.id}>
                  {eskul.nama_eskul}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnggota.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.nisn}</TableCell>
                <TableCell>{member.nama_siswa}</TableCell>
                <TableCell>{member.tingkat}</TableCell>
                <TableCell>{member.nama_kelas}</TableCell>
                <TableCell>{getEskulName(member.ekstrakurikuler_id)}</TableCell>
                <TableCell>{member.tanggal_masuk}</TableCell>
                <TableCell>
                  <Badge variant={member.status === "aktif" ? "default" : "secondary"}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
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
              {editingAnggota ? "Edit Anggota" : "Tambah Anggota"}
            </DialogTitle>
            <DialogDescription>
              Isi informasi anggota ekstrakurikuler di bawah ini
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ekstrakurikuler_id">Ekstrakurikuler *</Label>
              <Select
                value={formData.ekstrakurikuler_id}
                onValueChange={(value) => setFormData({ ...formData, ekstrakurikuler_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ekstrakurikuler" />
                </SelectTrigger>
                <SelectContent>
                  {ekstrakurikulers.map((eskul) => (
                    <SelectItem key={eskul.id} value={eskul.id}>
                      {eskul.nama_eskul}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nisn">NISN *</Label>
                <Input
                  id="nisn"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="Nomor Induk Siswa Nasional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nama_siswa">Nama Siswa *</Label>
                <Input
                  id="nama_siswa"
                  value={formData.nama_siswa}
                  onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
                  placeholder="Nama lengkap siswa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tingkat">Tingkat *</Label>
                <Select
                  value={formData.tingkat}
                  onValueChange={(value) => setFormData({ ...formData, tingkat: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nama_kelas">Nama Kelas *</Label>
                <Input
                  id="nama_kelas"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  placeholder="Contoh: X IPA 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tanggal_masuk">Tanggal Masuk *</Label>
                <Input
                  id="tanggal_masuk"
                  type="date"
                  value={formData.tanggal_masuk}
                  onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingAnggota ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
