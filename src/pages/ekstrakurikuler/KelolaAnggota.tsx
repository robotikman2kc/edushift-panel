import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { eskulDB } from "@/lib/eskulDB";
import { AnggotaEskul, Ekstrakurikuler } from "@/lib/indexedDB";
import { AlertCircle, ArrowUp, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const FILTER_STORAGE_KEY = 'kelola_anggota_eskul_filters';

export default function KelolaAnggota() {
  const [anggota, setAnggota] = useState<AnggotaEskul[]>([]);
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [showNaikKelasDialog, setShowNaikKelasDialog] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<AnggotaEskul[]>([]);
  const [showToggleStatusDialog, setShowToggleStatusDialog] = useState(false);
  const [selectedAnggotaForToggle, setSelectedAnggotaForToggle] = useState<AnggotaEskul | null>(null);
  const [selectedTingkat, setSelectedTingkat] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.tingkat || "all";
    }
    return "all";
  });
  const [selectedKelas, setSelectedKelas] = useState<string>(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      const filters = JSON.parse(saved);
      return filters.kelas || "all";
    }
    return "all";
  });

  const tingkatOptions = ["X", "XI", "XII"];

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      tingkat: selectedTingkat,
      kelas: selectedKelas
    }));
  }, [selectedTingkat, selectedKelas]);

  // Get unique kelas options based on selected tingkat
  const kelasOptions = useMemo(() => {
    let filtered = anggota;
    if (selectedTingkat !== "all") {
      filtered = anggota.filter(a => a.tingkat === selectedTingkat);
    }
    return [...new Set(filtered.map(a => a.nama_kelas))].sort();
  }, [anggota, selectedTingkat]);

  // Auto-select first kelas when tingkat changes (only if not loading from localStorage)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (isInitialLoad && anggota.length > 0) {
      setIsInitialLoad(false);
      return;
    }
    if (selectedTingkat !== "all" && kelasOptions.length > 0 && !isInitialLoad) {
      setSelectedKelas(kelasOptions[0]);
    } else if (selectedTingkat === "all") {
      setSelectedKelas("all");
    }
  }, [selectedTingkat, kelasOptions]);

  // Filter anggota based on selected filters
  const filteredAnggota = useMemo(() => {
    let filtered = anggota;
    
    if (selectedTingkat !== "all") {
      filtered = filtered.filter(a => a.tingkat === selectedTingkat);
    }
    
    if (selectedKelas !== "all") {
      filtered = filtered.filter(a => a.nama_kelas === selectedKelas);
    }
    
    return filtered;
  }, [anggota, selectedTingkat, selectedKelas]);

  useEffect(() => {
    loadData();
    cleanupLocalStorage();
  }, []);


  const cleanupLocalStorage = () => {
    // Hapus data ekstrakurikuler lama dari localStorage
    const keysToRemove = [
      'localdb_ekstrakurikuler',
      'localdb_anggota_eskul', 
      'localdb_kehadiran_eskul',
      'localdb_nilai_eskul'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Removed old data: ${key}`);
      }
    });
  };

  const loadData = async () => {
    // Load eskul data
    const eskuls = await eskulDB.select('ekstrakurikuler');
    
    if (eskuls.length > 0) {
      const eskulData = eskuls[0];
      setEskul(eskulData);
      
      // Load all anggota (active and inactive) for this eskul
      const anggotaData = await eskulDB.select('anggota_eskul', (a: AnggotaEskul) => 
        a.ekstrakurikuler_id === eskulData.id
      );
      setAnggota(anggotaData);
    } else {
      setEskul(null);
      setAnggota([]);
    }
  };

  const columns = [
    { key: "no", label: "No", sortable: false },
    { key: "nisn", label: "NISN", sortable: true },
    { key: "nama_siswa", label: "Nama Siswa", sortable: true },
    { key: "tingkat", label: "Tingkat", sortable: true },
    { key: "nama_kelas", label: "Kelas", sortable: true },
    { key: "tanggal_masuk", label: "Tanggal Masuk", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "aksi", label: "Aksi", sortable: false }
  ];

  const formFields = [
    { key: "nisn", label: "NISN", type: "text" as const, placeholder: "Nomor Induk Siswa Nasional", required: true },
    { key: "nama_siswa", label: "Nama Siswa", type: "text" as const, placeholder: "Nama lengkap siswa", required: true },
    { key: "tingkat", label: "Tingkat", type: "select" as const, placeholder: "Pilih tingkat", required: true, options: [
      { value: "X", label: "X" },
      { value: "XI", label: "XI" },
      { value: "XII", label: "XII" }
    ]},
    { key: "nama_kelas", label: "Nama Kelas", type: "text" as const, placeholder: "Contoh: X IPA 1", required: true },
    { key: "tanggal_masuk", label: "Tanggal Masuk", type: "date" as const, required: true }
  ];

  // Helper function untuk parse tanggal dari berbagai format
  const parseDate = (dateStr: any): string | undefined => {
    if (!dateStr) return undefined;
    
    // Handle Excel serial dates
    if (typeof dateStr === 'number' || !isNaN(Number(dateStr))) {
      const serialNumber = typeof dateStr === 'number' ? dateStr : Number(dateStr);
      const EXCEL_EPOCH_OFFSET = 25569;
      const MILLISECONDS_PER_DAY = 86400000;
      const unixTimestamp = (serialNumber - EXCEL_EPOCH_OFFSET) * MILLISECONDS_PER_DAY;
      const jsDate = new Date(unixTimestamp);
      
      if (!isNaN(jsDate.getTime())) {
        const year = jsDate.getUTCFullYear();
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    const dateString = String(dateStr);
    
    // Check if already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    
    // Parse DD/MM/YYYY or D/M/YYYY format
    const parts = dateString.trim().split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const isoFormat = `${year}-${month}-${day}`;
      const parsedDate = new Date(isoFormat);
      
      if (!isNaN(parsedDate.getTime())) {
        return isoFormat;
      }
    }
    
    return undefined;
  };

  const handleAdd = async (formData: Record<string, string>) => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    const dataToSave = {
      ...formData,
      ekstrakurikuler_id: eskul.id,
      status: "aktif"
    };

    const result = await eskulDB.insert('anggota_eskul', dataToSave);
    if (result.error) {
      toast.error("Gagal menambahkan anggota");
    } else {
      toast.success("Anggota berhasil ditambahkan");
      await loadData();
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    const result = await eskulDB.update('anggota_eskul', id, formData);
    if (result.error) {
      toast.error("Gagal mengupdate anggota");
    } else {
      toast.success("Anggota berhasil diupdate");
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await eskulDB.delete('anggota_eskul', id);
    if (result.error) {
      toast.error("Gagal menghapus anggota");
    } else {
      toast.success("Anggota berhasil dihapus");
      await loadData();
    }
  };

  const handleNaikKelas = () => {
    // Get active members only
    const activeMembers = anggota.filter(a => a.status === 'aktif');
    setSelectedAnggota(activeMembers);
    setShowNaikKelasDialog(true);
  };

  const confirmNaikKelas = async () => {
    try {
      let successCount = 0;
      let graduatedCount = 0;

      for (const member of selectedAnggota) {
        let newTingkat = member.tingkat;
        let newStatus = member.status;

        // Tingkat naik: X -> XI, XI -> XII, XII -> non-aktif (lulus)
        if (member.tingkat === 'X') {
          newTingkat = 'XI';
        } else if (member.tingkat === 'XI') {
          newTingkat = 'XII';
        } else if (member.tingkat === 'XII') {
          newStatus = 'non-aktif';
          graduatedCount++;
        }

        const result = await eskulDB.update('anggota_eskul', member.id, {
          tingkat: newTingkat,
          status: newStatus
        });

        if (!result.error) {
          successCount++;
        }
      }

      toast.success(`${successCount} anggota berhasil naik kelas${graduatedCount > 0 ? `, ${graduatedCount} lulus` : ''}`);
      await loadData();
      setShowNaikKelasDialog(false);
    } catch (error) {
      toast.error("Gagal melakukan naik kelas");
    }
  };

  const openToggleStatusDialog = (anggotaItem: AnggotaEskul) => {
    setSelectedAnggotaForToggle(anggotaItem);
    setShowToggleStatusDialog(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedAnggotaForToggle) return;
    
    const newStatus = selectedAnggotaForToggle.status === 'aktif' ? 'non-aktif' : 'aktif';
    const result = await eskulDB.update('anggota_eskul', selectedAnggotaForToggle.id, { status: newStatus });
    
    if (result.error) {
      toast.error("Gagal mengubah status anggota");
    } else {
      toast.success(`Anggota berhasil ${newStatus === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`);
      await loadData();
    }
    
    setShowToggleStatusDialog(false);
    setSelectedAnggotaForToggle(null);
  };

  const handleImport = async (data: Record<string, string>[]) => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Skip baris kosong atau baris instruksi
          if (!row.NISN || !row["Nama Siswa"] || 
              String(row.NISN).trim() === '' || 
              String(row["Nama Siswa"]).trim() === '' ||
              String(row.Tingkat).includes('Format:') ||
              String(row["Tanggal Masuk"]).includes('Format:')) {
            continue;
          }

          // Cek apakah NISN sudah ada - jika ada, update data
          const allAnggota = await eskulDB.select('anggota_eskul', (a: AnggotaEskul) => 
            a.ekstrakurikuler_id === eskul.id
          );
          const existingAnggota = allAnggota.find(a => a.nisn === row.NISN);

          const anggotaData = {
            ekstrakurikuler_id: eskul.id,
            nisn: String(row.NISN).trim(),
            nama_siswa: String(row["Nama Siswa"]).trim(),
            tingkat: String(row.Tingkat).trim(),
            nama_kelas: String(row["Nama Kelas"]).trim(),
            tanggal_masuk: parseDate(row["Tanggal Masuk"]) || new Date().toISOString().split('T')[0],
            status: "aktif"
          };

          if (existingAnggota) {
            // Update existing
            const result = await eskulDB.update('anggota_eskul', existingAnggota.id, anggotaData);
            if (result.error) {
              throw new Error(result.error);
            }
          } else {
            // Insert new
            const result = await eskulDB.insert('anggota_eskul', anggotaData);
            if (result.error) {
              throw new Error(result.error);
            }
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`NISN ${row.NISN}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil import ${successCount} anggota`);
        await loadData();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} data gagal diimport`, {
          description: errors.slice(0, 3).join('; ')
        });
      }
    } catch (error: any) {
      toast.error("Gagal import data: " + error.message);
    }
  };


  // Format data untuk tampilan tabel dengan action buttons
  const formattedAnggota = filteredAnggota.map((item, index) => ({
    ...item,
    no: index + 1,
    aksi: (
      <Button
        size="sm"
        variant={item.status === 'aktif' ? 'destructive' : 'default'}
        onClick={() => openToggleStatusDialog(item)}
      >
        {item.status === 'aktif' ? (
          <>
            <UserX className="h-4 w-4 mr-1" />
            Nonaktifkan
          </>
        ) : (
          <>
            <UserCheck className="h-4 w-4 mr-1" />
            Aktifkan
          </>
        )}
      </Button>
    )
  }));

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kelola Anggota Ekstrakurikuler"
          description="Kelola data anggota ekstrakurikuler"
        />
        <Card className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan buat pengaturan ekstrakurikuler terlebih dahulu di menu "Kelola Ekstrakurikuler"
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  const activeCount = anggota.filter(a => a.status === 'aktif').length;
  const inactiveCount = anggota.filter(a => a.status === 'non-aktif').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kelola Anggota - ${eskul.nama_eskul}`}
        description={`Kelola data anggota ekstrakurikuler • Aktif: ${activeCount} • Non-aktif: ${inactiveCount}`}
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Filter Tingkat</Label>
            <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Semua Tingkat" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Semua Tingkat</SelectItem>
                {tingkatOptions.map((tingkat) => (
                  <SelectItem key={tingkat} value={tingkat}>
                    {tingkat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter Kelas</Label>
            <Select value={selectedKelas} onValueChange={setSelectedKelas}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasOptions.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>
                    {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleNaikKelas}
            variant="default"
            disabled={activeCount === 0}
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Naik Kelas Semua Anggota Aktif
          </Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={formattedAnggota}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        formFields={formFields}
        searchPlaceholder="Cari anggota..."
        title="Data Anggota Ekstrakurikuler"
        tableId="anggota-eskul"
      />

      <AlertDialog open={showNaikKelasDialog} onOpenChange={setShowNaikKelasDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Naik Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Fitur ini akan menaikkan tingkat semua anggota aktif:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Tingkat X → XI</li>
                <li>Tingkat XI → XII</li>
                <li>Tingkat XII → Non-aktif (Lulus)</li>
              </ul>
              <br />
              Total anggota aktif yang akan diproses: <strong>{selectedAnggota.length}</strong>
              <br /><br />
              Apakah Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNaikKelas}>
              Ya, Naik Kelas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showToggleStatusDialog} onOpenChange={setShowToggleStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Ubah Status</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnggotaForToggle && (
                <>
                  Apakah Anda yakin ingin {selectedAnggotaForToggle.status === 'aktif' ? 'menonaktifkan' : 'mengaktifkan'} anggota berikut?
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="font-medium">{selectedAnggotaForToggle.nama_siswa}</p>
                    <p className="text-sm text-muted-foreground">NISN: {selectedAnggotaForToggle.nisn}</p>
                    <p className="text-sm text-muted-foreground">Kelas: {selectedAnggotaForToggle.tingkat} {selectedAnggotaForToggle.nama_kelas}</p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              Ya, {selectedAnggotaForToggle?.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
