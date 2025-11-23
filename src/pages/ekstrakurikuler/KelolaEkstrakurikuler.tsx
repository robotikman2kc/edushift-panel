import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { eskulDB } from "@/lib/eskulDB";
import { Ekstrakurikuler } from "@/lib/indexedDB";
import { Save, Trash2, Plus, List } from "lucide-react";
import { toast } from "sonner";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function KelolaEkstrakurikuler() {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [allEskuls, setAllEskuls] = useState<Ekstrakurikuler[]>([]);
  const [eskulId, setEskulId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_eskul: "",
    pembimbing: "",
    hari_pertemuan: "",
    jam_pertemuan: "",
    deskripsi: "",
    status: "aktif"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const eskuls = await eskulDB.select('ekstrakurikuler');
    setAllEskuls(eskuls);
  };

  const handleEdit = (eskul: Ekstrakurikuler) => {
    setEskulId(eskul.id);
    setFormData({
      nama_eskul: eskul.nama_eskul,
      pembimbing: eskul.pembimbing,
      hari_pertemuan: eskul.hari_pertemuan,
      jam_pertemuan: eskul.jam_pertemuan,
      deskripsi: eskul.deskripsi || "",
      status: eskul.status
    });
    setViewMode('form');
  };

  const handleNew = () => {
    setEskulId(null);
    setFormData({
      nama_eskul: "",
      pembimbing: "",
      hari_pertemuan: "",
      jam_pertemuan: "",
      deskripsi: "",
      status: "aktif"
    });
    setViewMode('form');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const result = await eskulDB.delete('ekstrakurikuler', deleteId);
    if (result.error) {
      toast.error("Gagal menghapus ekstrakurikuler");
    } else {
      toast.success("Ekstrakurikuler berhasil dihapus");
      setDeleteId(null);
      loadData();
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_eskul || !formData.pembimbing || !formData.hari_pertemuan || !formData.jam_pertemuan) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (eskulId) {
      // Update existing
      const result = await eskulDB.update('ekstrakurikuler', eskulId, formData);
      if (result.error) {
        toast.error("Gagal mengupdate pengaturan ekstrakurikuler");
      } else {
        toast.success("Pengaturan ekstrakurikuler berhasil diupdate");
        setViewMode('list');
        loadData();
      }
    } else {
      // Create new
      const result = await eskulDB.insert('ekstrakurikuler', formData);
      if (result.error) {
        toast.error("Gagal menyimpan pengaturan ekstrakurikuler");
      } else {
        toast.success("Pengaturan ekstrakurikuler berhasil disimpan");
        setViewMode('list');
        loadData();
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Ekstrakurikuler"
        description="Kelola daftar ekstrakurikuler sekolah"
      />

      {viewMode === 'list' ? (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Daftar Ekstrakurikuler</h3>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Baru
            </Button>
          </div>

          {allEskuls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data ekstrakurikuler</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Pembimbing</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEskuls.map((eskul) => (
                  <TableRow key={eskul.id}>
                    <TableCell className="font-medium">{eskul.nama_eskul}</TableCell>
                    <TableCell>{eskul.pembimbing}</TableCell>
                    <TableCell>
                      {eskul.hari_pertemuan}, {eskul.jam_pertemuan}
                    </TableCell>
                    <TableCell>
                      <Badge variant={eskul.status === 'aktif' ? 'default' : 'secondary'}>
                        {eskul.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(eskul)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(eskul.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {eskulId ? 'Edit' : 'Tambah'} Ekstrakurikuler
            </h3>
            <Button variant="outline" onClick={() => setViewMode('list')}>
              Kembali ke Daftar
            </Button>
          </div>

          <div className="grid gap-6 max-w-2xl">
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
              <Label htmlFor="pembimbing">Guru Pembimbing *</Label>
              <Input
                id="pembimbing"
                value={formData.pembimbing}
                onChange={(e) => setFormData({ ...formData, pembimbing: e.target.value })}
                placeholder="Nama guru pembimbing ekstrakurikuler"
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ekstrakurikuler</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ekstrakurikuler ini? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}
