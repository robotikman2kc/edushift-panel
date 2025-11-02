import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface AgendaMengajar {
  id: string;
  tanggal: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  materi: string;
  keterangan: string;
  created_at: string;
  updated_at?: string;
}

const AgendaMengajar = () => {
  const [agendaList, setAgendaList] = useState<AgendaMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<any[]>([]);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaMengajar | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    tanggal: '',
    kelas_id: '',
    mata_pelajaran_id: '',
    materi: '',
    keterangan: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [agenda, kelas, mataPelajaran] = await Promise.all([
        indexedDB.select('agenda_mengajar'),
        indexedDB.select('kelas'),
        indexedDB.select('mata_pelajaran'),
      ]);

      // Filter agenda by selected month
      const filteredAgenda = (agenda as AgendaMengajar[]).filter((item) => {
        const itemMonth = format(new Date(item.tanggal), 'yyyy-MM');
        return itemMonth === selectedMonth;
      });

      setAgendaList(filteredAgenda);
      setKelasList(kelas);
      setMataPelajaranList(mataPelajaran);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: '',
      kelas_id: '',
      mata_pelajaran_id: '',
      materi: '',
      keterangan: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.tanggal || !formData.kelas_id || !formData.mata_pelajaran_id || !formData.materi) {
      toast({
        title: "Peringatan",
        description: "Harap isi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }

    try {
      await indexedDB.insert('agenda_mengajar', formData);
      toast({
        title: "Berhasil",
        description: "Agenda berhasil ditambahkan",
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding agenda:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan agenda",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedAgenda || !formData.tanggal || !formData.kelas_id || !formData.mata_pelajaran_id || !formData.materi) {
      toast({
        title: "Peringatan",
        description: "Harap isi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }

    try {
      await indexedDB.update('agenda_mengajar', selectedAgenda.id, formData);
      toast({
        title: "Berhasil",
        description: "Agenda berhasil diperbarui",
      });
      setIsEditDialogOpen(false);
      setSelectedAgenda(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error updating agenda:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui agenda",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAgenda) return;

    try {
      await indexedDB.delete('agenda_mengajar', selectedAgenda.id);
      toast({
        title: "Berhasil",
        description: "Agenda berhasil dihapus",
      });
      setIsDeleteDialogOpen(false);
      setSelectedAgenda(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting agenda:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus agenda",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (agenda: AgendaMengajar) => {
    setSelectedAgenda(agenda);
    setFormData({
      tanggal: agenda.tanggal,
      kelas_id: agenda.kelas_id,
      mata_pelajaran_id: agenda.mata_pelajaran_id,
      materi: agenda.materi,
      keterangan: agenda.keterangan,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agenda: AgendaMengajar) => {
    setSelectedAgenda(agenda);
    setIsDeleteDialogOpen(true);
  };

  const getKelasName = (kelasId: string) => {
    const kelas = kelasList.find((k) => k.id === kelasId);
    return kelas ? kelas.nama_kelas : '-';
  };

  const getMataPelajaranName = (mataPelajaranId: string) => {
    const mapel = mataPelajaranList.find((m) => m.id === mataPelajaranId);
    return mapel ? mapel.nama_mata_pelajaran : '-';
  };

  const getNamaHari = (tanggal: string) => {
    return format(new Date(tanggal), 'EEEE', { locale: localeId });
  };

  const handleExportExcel = () => {
    const exportData = agendaList.map((agenda, index) => ({
      No: index + 1,
      Hari: getNamaHari(agenda.tanggal),
      Tanggal: format(new Date(agenda.tanggal), 'dd MMMM yyyy', { locale: localeId }),
      Kelas: getKelasName(agenda.kelas_id),
      'Mata Pelajaran': getMataPelajaranName(agenda.mata_pelajaran_id),
      Materi: agenda.materi,
      Keterangan: agenda.keterangan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agenda Mengajar");

    const monthName = format(new Date(selectedMonth), 'MMMM yyyy', { locale: localeId });
    XLSX.writeFile(workbook, `Agenda_Mengajar_${monthName}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke Excel",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda Mengajar"
        description="Kelola catatan agenda mengajar harian"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Daftar Agenda Mengajar</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Agenda
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={agendaList.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : agendaList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada agenda untuk bulan ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendaList.map((agenda, index) => (
                    <TableRow key={agenda.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{getNamaHari(agenda.tanggal)}</TableCell>
                      <TableCell>
                        {format(new Date(agenda.tanggal), 'dd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell>{getKelasName(agenda.kelas_id)}</TableCell>
                      <TableCell>{getMataPelajaranName(agenda.mata_pelajaran_id)}</TableCell>
                      <TableCell>{agenda.materi}</TableCell>
                      <TableCell>{agenda.keterangan || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(agenda)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(agenda)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Agenda Mengajar</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk menambahkan agenda mengajar baru
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kelas">Kelas *</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mata_pelajaran">Mata Pelajaran *</Label>
              <Select
                value={formData.mata_pelajaran_id}
                onValueChange={(value) => setFormData({ ...formData, mata_pelajaran_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaranList.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materi">Materi *</Label>
              <Textarea
                id="materi"
                value={formData.materi}
                onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                placeholder="Masukkan materi yang diajarkan"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan (opsional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agenda Mengajar</DialogTitle>
            <DialogDescription>
              Ubah data agenda mengajar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tanggal">Tanggal *</Label>
              <Input
                id="edit-tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-kelas">Kelas *</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-mata_pelajaran">Mata Pelajaran *</Label>
              <Select
                value={formData.mata_pelajaran_id}
                onValueChange={(value) => setFormData({ ...formData, mata_pelajaran_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {mataPelajaranList.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-materi">Materi *</Label>
              <Textarea
                id="edit-materi"
                value={formData.materi}
                onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                placeholder="Masukkan materi yang diajarkan"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-keterangan">Keterangan</Label>
              <Textarea
                id="edit-keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan (opsional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Agenda</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus agenda ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaMengajar;
