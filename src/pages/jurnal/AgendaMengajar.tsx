import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { getActiveTahunAjaran } from "@/lib/academicYearUtils";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { generatePDFBlob, getCustomPDFTemplate } from "@/lib/exportUtils";
import { ExportDateDialog } from "@/components/common/ExportDateDialog";

interface AgendaMengajar {
  id: string;
  tanggal: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  materi: string;
  keterangan: string;
  jenis_pembelajaran?: string;
  created_at: string;
  updated_at?: string;
}

const AgendaMengajar = () => {
  const location = useLocation();
  const [agendaList, setAgendaList] = useState<AgendaMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartMonth, setSelectedStartMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEndMonth, setSelectedEndMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('all');
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<any[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<any[]>([]);
  const [filteredMataPelajaranList, setFilteredMataPelajaranList] = useState<any[]>([]);
  const [jadwalPelajaranList, setJadwalPelajaranList] = useState<any[]>([]);
  const [isExportDateDialogOpen, setIsExportDateDialogOpen] = useState(false);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaMengajar | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    kelas_id: '',
    mata_pelajaran_id: '',
    materi: '',
    keterangan: '',
    jenis_pembelajaran: '',
  });


  // Handle data from dashboard navigation or kehadiran page
  useEffect(() => {
    // Check for filter from kehadiran page
    const savedFilters = localStorage.getItem('agenda_mengajar_from_kehadiran');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        const { kelas_id, mata_pelajaran_id, tanggal } = filters;
        
        setFormData({
          tanggal: tanggal || format(new Date(), 'yyyy-MM-dd'),
          kelas_id: kelas_id || '',
          mata_pelajaran_id: mata_pelajaran_id || '',
          materi: '',
          keterangan: '',
          jenis_pembelajaran: '',
        });
        
        setSelectedKelasFilter(kelas_id || 'all');
        
        // Filter kelas and mata pelajaran based on date
        if (tanggal) {
          filterByDate(tanggal);
        }
        
        toast({
          title: "Filter Diterapkan",
          description: "Filter dari Input Kehadiran telah diterapkan",
        });
        
        // Clear saved filters
        localStorage.removeItem('agenda_mengajar_from_kehadiran');
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
    
    // Check for navigation from dashboard
    const state = location.state as any;
    if (state?.fromSchedule && state?.scheduleData) {
      const { kelas_id, mata_pelajaran_id } = state.scheduleData;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      setFormData({
        tanggal: today,
        kelas_id: kelas_id,
        mata_pelajaran_id: mata_pelajaran_id,
        materi: '',
        keterangan: '',
        jenis_pembelajaran: '',
      });
      
      // Filter kelas and mata pelajaran based on today
      filterByDate(today);
      
      toast({
        title: "Filter Otomatis",
        description: "Kelas dan mata pelajaran telah dipilih sesuai jadwal",
      });
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const initData = async () => {
      const year = await getActiveTahunAjaran();
      setActiveTahunAjaran(year);
      fetchData();
    };
    initData();
  }, [selectedStartMonth, selectedEndMonth, selectedKelasFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const year = activeTahunAjaran || await getActiveTahunAjaran();
      
      // Fetch all required data - filter kelas and jadwal by tahun_ajaran
      const [agenda, kelas, mataPelajaran, jadwalPelajaran] = await Promise.all([
        indexedDB.select('agenda_mengajar', (a: any) => a.tahun_ajaran === year),
        indexedDB.select('kelas', (k: any) => k.tahun_ajaran === year),
        indexedDB.select('mata_pelajaran'),
        indexedDB.select('jadwal_pelajaran', (j: any) => j.tahun_ajaran === year),
      ]);

      // Filter agenda by selected month range and class
      const filteredAgenda = (agenda as AgendaMengajar[]).filter((item) => {
        const itemDate = new Date(item.tanggal);
        const startDate = new Date(selectedStartMonth + '-01');
        const endDate = new Date(selectedEndMonth + '-01');
        endDate.setMonth(endDate.getMonth() + 1); // Go to next month
        endDate.setDate(0); // Go back to last day of selected end month
        
        const matchesDateRange = itemDate >= startDate && itemDate <= endDate;
        const matchesKelas = selectedKelasFilter === 'all' || item.kelas_id === selectedKelasFilter;
        return matchesDateRange && matchesKelas;
      });

      setAgendaList(filteredAgenda);
      setKelasList(kelas);
      setMataPelajaranList(mataPelajaran);
      setJadwalPelajaranList(jadwalPelajaran);
      
      // Filter by current date if form has a date
      if (formData.tanggal) {
        filterByDateWithData(formData.tanggal, kelas, mataPelajaran, jadwalPelajaran);
      }
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
    const today = format(new Date(), 'yyyy-MM-dd');
    setFormData({
      tanggal: today,
      kelas_id: '',
      mata_pelajaran_id: '',
      materi: '',
      keterangan: '',
      jenis_pembelajaran: '',
    });
    filterByDate(today);
  };

  // Filter kelas and mata pelajaran based on selected date
  const filterByDateWithData = (selectedDate: string, kelasList: any[], mataPelajaranList: any[], jadwalPelajaranList: any[]) => {
    if (!selectedDate) {
      setFilteredKelasList([]);
      setFilteredMataPelajaranList([]);
      return;
    }

    // Get day of week from selected date (0 = Minggu, 1 = Senin, etc.)
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    // Convert to Indonesian day name
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const selectedDay = dayNames[dayOfWeek];

    // Filter jadwal based on selected day
    const scheduleForDay = jadwalPelajaranList.filter((jadwal: any) => jadwal.hari === selectedDay);

    // Get unique kelas_id and mata_pelajaran_id from the schedule
    const kelasIds = [...new Set(scheduleForDay.map((jadwal: any) => jadwal.kelas_id))];
    const mataPelajaranIds = [...new Set(scheduleForDay.map((jadwal: any) => jadwal.mata_pelajaran_id))];

    // Filter kelas and mata pelajaran lists
    const filteredKelas = kelasList.filter((kelas) => kelasIds.includes(kelas.id));
    const filteredMataPelajaran = mataPelajaranList.filter((mapel) => mataPelajaranIds.includes(mapel.id));

    setFilteredKelasList(filteredKelas);
    setFilteredMataPelajaranList(filteredMataPelajaran);
  };

  const filterByDate = (selectedDate: string) => {
    filterByDateWithData(selectedDate, kelasList, mataPelajaranList, jadwalPelajaranList);
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
      const year = activeTahunAjaran || await getActiveTahunAjaran();
      // Insert agenda with tahun_ajaran
      await indexedDB.insert('agenda_mengajar', {
        ...formData,
        tahun_ajaran: year
      });
      
      // Auto-create jurnal guru
      await createAutoJurnal(formData.tanggal, formData.kelas_id, formData.mata_pelajaran_id);
      
      toast({
        title: "Berhasil",
        description: "Agenda dan jurnal berhasil ditambahkan",
      });
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

  const createAutoJurnal = async (tanggal: string, kelasId: string, mataPelajaranId: string) => {
    try {
      // Get jenis kegiatan "Mengajar"
      const jenisKegiatanList = await indexedDB.select('jenis_kegiatan');
      const jenisKegiatanMengajar = jenisKegiatanList.find((jk: any) => jk.nama_kegiatan === 'Mengajar');
      
      if (!jenisKegiatanMengajar) {
        console.warn('Jenis kegiatan "Mengajar" tidak ditemukan');
        return;
      }

      // Get kelas name
      const kelas = kelasList.find((k) => k.id === kelasId);
      const kelasNama = kelas ? kelas.nama_kelas : 'kelas';

      // Get day of week and find jadwal
      const date = new Date(tanggal);
      const dayOfWeek = date.getDay();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const selectedDay = dayNames[dayOfWeek];

      // Find jadwal for this day, kelas, and mata pelajaran
      const jadwal = jadwalPelajaranList.find((j: any) => 
        j.hari === selectedDay && 
        j.kelas_id === kelasId && 
        j.mata_pelajaran_id === mataPelajaranId
      );

      const jumlahJP = jadwal?.jumlah_jp || 1;

      // Create jurnal
      await indexedDB.insert('jurnal', {
        tanggal: tanggal,
        jenis_kegiatan_id: jenisKegiatanMengajar.id,
        volume: jumlahJP,
        uraian_kegiatan: `Melaksanakan KBM di kelas ${kelasNama}`,
        satuan_hasil: 'JP'
      });
      
      console.log('Auto-jurnal created successfully');
    } catch (error) {
      console.error('Error creating auto jurnal:', error);
      // Don't throw error to prevent blocking agenda creation
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
      jenis_pembelajaran: agenda.jenis_pembelajaran || '',
    });
    filterByDate(agenda.tanggal);
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


  const handleExportPDF = (signatureDate?: Date) => {
    try {
      const exportData = agendaList.map((agenda, index) => ({
        'No': index + 1,
        'Hari': getNamaHari(agenda.tanggal),
        'Tanggal': format(new Date(agenda.tanggal), 'dd MMM yyyy', { locale: localeId }),
        'Kelas': getKelasName(agenda.kelas_id),
        'Mata Pelajaran': getMataPelajaranName(agenda.mata_pelajaran_id),
        'Jenis Pembelajaran': agenda.jenis_pembelajaran || '-',
        'Materi': agenda.materi,
        'Keterangan': agenda.keterangan,
      }));

      const exportColumns = [
        { key: 'No', label: 'No' },
        { key: 'Hari', label: 'Hari' },
        { key: 'Tanggal', label: 'Tanggal' },
        { key: 'Kelas', label: 'Kelas' },
        { key: 'Mata Pelajaran', label: 'Mata Pelajaran' },
        { key: 'Jenis Pembelajaran', label: 'Jenis Pembelajaran' },
        { key: 'Materi', label: 'Materi' },
        { key: 'Keterangan', label: 'Keterangan' },
      ];

      const startMonthName = format(new Date(selectedStartMonth + '-01'), 'MMMM yyyy', { locale: localeId });
      const endMonthName = format(new Date(selectedEndMonth + '-01'), 'MMMM yyyy', { locale: localeId });
      const periodName = selectedStartMonth === selectedEndMonth 
        ? startMonthName 
        : `${startMonthName} - ${endMonthName}`;

      const kelasName = selectedKelasFilter === 'all' 
        ? 'Semua Kelas' 
        : getKelasName(selectedKelasFilter);

      const title = `Laporan Daftar Agenda Mengajar - ${kelasName} - ${periodName}`;
      
      let customTemplate = getCustomPDFTemplate('journal');
      
      // Override reportTitle specifically for Agenda Mengajar
      customTemplate = {
        ...customTemplate,
        reportTitle: 'LAPORAN DAFTAR AGENDA MENGAJAR'
      };
      
      if (signatureDate) {
        customTemplate = {
          ...customTemplate,
          signatureDate: signatureDate.toISOString().split('T')[0],
        };
      }

      const blob = generatePDFBlob(
        exportData, 
        exportColumns, 
        title, 
        customTemplate,
        { bulan: periodName }
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Agenda_Mengajar_${periodName.replace(/ /g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke PDF",
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data ke PDF",
        variant: "destructive",
      });
    }
  };

  const handleCellEdit = (rowId: string, columnKey: string, currentValue: string) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(currentValue);
  };

  const handleCellSave = async (rowId: string, columnKey: string) => {
    if (editValue !== null) {
      const agenda = agendaList.find(a => a.id === rowId);
      if (agenda) {
        try {
          const updatedData = { ...agenda, [columnKey]: editValue };
          await indexedDB.update('agenda_mengajar', rowId, updatedData);
          toast({
            title: "Berhasil",
            description: "Data berhasil diperbarui",
          });
          fetchData();
        } catch (error) {
          toast({
            title: "Error",
            description: "Gagal memperbarui data",
            variant: "destructive",
          });
        }
      }
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Pagination
  const totalPages = Math.ceil(agendaList.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAgenda = agendaList.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda Mengajar"
        description="Kelola catatan agenda mengajar harian"
      />

      {/* Form Tambah Agenda */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Tambah Agenda Baru</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal" className="text-sm font-medium">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData({ ...formData, tanggal: newDate, kelas_id: '', mata_pelajaran_id: '' });
                  filterByDate(newDate);
                }}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kelas" className="text-sm font-medium">Kelas *</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                disabled={!formData.tanggal || filteredKelasList.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.tanggal ? "Pilih tanggal dahulu" : filteredKelasList.length === 0 ? "Tidak ada jadwal" : "Pilih kelas"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mata_pelajaran" className="text-sm font-medium">Mata Pelajaran *</Label>
              <Select
                value={formData.mata_pelajaran_id}
                onValueChange={(value) => setFormData({ ...formData, mata_pelajaran_id: value })}
                disabled={!formData.tanggal || filteredMataPelajaranList.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.tanggal ? "Pilih tanggal dahulu" : filteredMataPelajaranList.length === 0 ? "Tidak ada jadwal" : "Pilih mata pelajaran"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredMataPelajaranList.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenis-pembelajaran" className="text-sm font-medium">Jenis Pembelajaran</Label>
              <Select
                value={formData.jenis_pembelajaran}
                onValueChange={(value) => setFormData({ ...formData, jenis_pembelajaran: value })}
              >
                <SelectTrigger id="jenis-pembelajaran">
                  <SelectValue placeholder="Pilih jenis pembelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penilaian Harian">Penilaian Harian</SelectItem>
                  <SelectItem value="Kegiatan Belajar Mengajar">Kegiatan Belajar Mengajar</SelectItem>
                  <SelectItem value="Praktek">Praktek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materi" className="text-sm font-medium">Materi *</Label>
              <Textarea
                id="materi"
                value={formData.materi}
                onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                placeholder="Masukkan materi yang diajarkan"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan" className="text-sm font-medium">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan (opsional)"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm} size="sm">
              Reset
            </Button>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Simpan Agenda
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Daftar Agenda Mengajar</CardTitle>
            <div className="flex flex-col lg:flex-row gap-2 w-full justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Dari:</Label>
                  <Input
                    type="month"
                    value={selectedStartMonth}
                    onChange={(e) => setSelectedStartMonth(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Sampai:</Label>
                  <Input
                    type="month"
                    value={selectedEndMonth}
                    onChange={(e) => setSelectedEndMonth(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                </div>
                <Select
                  value={selectedKelasFilter}
                  onValueChange={setSelectedKelasFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {kelasList.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <Button
                  onClick={() => setIsExportDateDialogOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={agendaList.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
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
            <div className="border rounded-lg max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Jenis Pembelajaran</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgenda.map((agenda, index) => (
                    <TableRow key={agenda.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>{getNamaHari(agenda.tanggal)}</TableCell>
                      <TableCell>
                        {format(new Date(agenda.tanggal), 'dd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell>{getKelasName(agenda.kelas_id)}</TableCell>
                      <TableCell>{getMataPelajaranName(agenda.mata_pelajaran_id)}</TableCell>
                      <TableCell>{agenda.jenis_pembelajaran || '-'}</TableCell>
                      <TableCell
                        onDoubleClick={() => handleCellEdit(agenda.id, 'materi', agenda.materi)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        {editingCell?.rowId === agenda.id && editingCell?.columnKey === 'materi' ? (
                          <div className="flex gap-1">
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) handleCellSave(agenda.id, 'materi');
                                if (e.key === 'Escape') handleCellCancel();
                              }}
                              className="min-h-[60px] text-sm"
                              autoFocus
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleCellSave(agenda.id, 'materi')} className="h-8 px-2">
                                ✓
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-8 px-2">
                                ✗
                              </Button>
                            </div>
                          </div>
                        ) : (
                          agenda.materi
                        )}
                      </TableCell>
                      <TableCell
                        onDoubleClick={() => handleCellEdit(agenda.id, 'keterangan', agenda.keterangan || '')}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        {editingCell?.rowId === agenda.id && editingCell?.columnKey === 'keterangan' ? (
                          <div className="flex gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave(agenda.id, 'keterangan');
                                if (e.key === 'Escape') handleCellCancel();
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={() => handleCellSave(agenda.id, 'keterangan')} className="h-8 px-2">
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-8 px-2">
                              ✗
                            </Button>
                          </div>
                        ) : (
                          agenda.keterangan || '-'
                        )}
                      </TableCell>
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

          {/* Pagination */}
          {agendaList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  dari {agendaList.length} data
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData({ ...formData, tanggal: newDate, kelas_id: '', mata_pelajaran_id: '' });
                  filterByDate(newDate);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-kelas">Kelas *</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                disabled={!formData.tanggal || filteredKelasList.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.tanggal ? "Pilih tanggal terlebih dahulu" : filteredKelasList.length === 0 ? "Tidak ada jadwal untuk hari ini" : "Pilih kelas"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelasList.map((kelas) => (
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
                disabled={!formData.tanggal || filteredMataPelajaranList.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.tanggal ? "Pilih tanggal terlebih dahulu" : filteredMataPelajaranList.length === 0 ? "Tidak ada jadwal untuk hari ini" : "Pilih mata pelajaran"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredMataPelajaranList.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-jenis-pembelajaran">Jenis Pembelajaran</Label>
              <Select
                value={formData.jenis_pembelajaran}
                onValueChange={(value) => setFormData({ ...formData, jenis_pembelajaran: value })}
              >
                <SelectTrigger id="edit-jenis-pembelajaran">
                  <SelectValue placeholder="Pilih jenis pembelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penilaian Harian">Penilaian Harian</SelectItem>
                  <SelectItem value="Kegiatan Belajar Mengajar">Kegiatan Belajar Mengajar</SelectItem>
                  <SelectItem value="Praktek">Praktek</SelectItem>
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

      <ExportDateDialog
        open={isExportDateDialogOpen}
        onOpenChange={setIsExportDateDialogOpen}
        onExport={handleExportPDF}
        title="Export Agenda Mengajar ke PDF"
        description="Pilih tanggal untuk tanda tangan dokumen"
      />
    </div>
  );
};

export default AgendaMengajar;
