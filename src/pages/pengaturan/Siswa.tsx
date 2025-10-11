import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indexedDB } from "@/lib/indexedDB";
import { toast } from "@/hooks/use-toast";

interface Siswa {
  id: string;
  nis: string;
  nama_siswa: string;
  kelas_id: string;
  kelas?: {
    nama_kelas: string;
  };
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  tanggal_lahir: string;
  tempat_lahir: string;
  alamat: string;
  nama_orang_tua: string;
  telepon_orang_tua: string;
  email: string;
  status: string;
  created_at: string;
}

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
}

const Siswa = () => {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [selectedTingkat, setSelectedTingkat] = useState<string>("");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "nis", label: "NIS", sortable: true },
    { key: "nama_siswa", label: "Nama Siswa", sortable: true },
    { key: "kelas_nama", label: "Kelas", sortable: true },
    { key: "jenis_kelamin", label: "Jenis Kelamin", sortable: true },
    { key: "nama_orang_tua", label: "Orang Tua", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const formFields = [
    { key: "nis", label: "NIS", type: "text" as const, placeholder: "Masukkan NIS", required: true },
    { key: "nama_siswa", label: "Nama Siswa", type: "text" as const, placeholder: "Masukkan nama siswa", required: true },
    { key: "kelas_id", label: "Kelas", type: "select" as const, placeholder: "Pilih kelas", required: true, options: 
      filteredKelas.map(k => ({ value: k.id, label: k.nama_kelas }))
    },
    { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select" as const, placeholder: "Pilih jenis kelamin", required: true, options: [
      { value: "Laki-laki", label: "Laki-laki" },
      { value: "Perempuan", label: "Perempuan" }
    ]},
    { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" as const, required: false },
    { key: "tempat_lahir", label: "Tempat Lahir", type: "text" as const, placeholder: "Masukkan tempat lahir", required: false },
    { key: "alamat", label: "Alamat", type: "text" as const, placeholder: "Masukkan alamat", required: false },
    { key: "nama_orang_tua", label: "Nama Orang Tua", type: "text" as const, placeholder: "Masukkan nama orang tua", required: false },
    { key: "telepon_orang_tua", label: "Telepon Orang Tua", type: "tel" as const, placeholder: "Masukkan nomor telepon", required: false },
    { key: "email", label: "Email", type: "email" as const, placeholder: "Masukkan email", required: false },
  ];

  const fetchKelas = async () => {
    try {
      const data = await indexedDB.select('kelas');
      setKelas(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data kelas: " + error,
        variant: "destructive",
      });
    }
  };

  const fetchSiswa = async () => {
    try {
      setLoading(true);
      const data = await indexedDB.select('siswa');
      const allKelas = await indexedDB.select('kelas');

      // Format the data to match the expected structure
      const formattedData = data.map(item => {
        const kelas = allKelas.find(k => k.id === item.kelas_id);
        return {
          ...item,
          jenis_kelamin: item.jenis_kelamin as 'Laki-laki' | 'Perempuan',
          kelas_nama: kelas?.nama_kelas || 'Tidak ada kelas',
          tanggal_lahir: item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '',
          created_at: new Date(item.created_at).toLocaleDateString('id-ID')
        };
      });

      setSiswa(formattedData);
      setFilteredSiswa(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data siswa: " + error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchSiswa();
    loadLastSelectedClass();
  }, []);

  const loadLastSelectedClass = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const lastTingkat = settings.find((s: any) => s.key === "last_selected_tingkat_siswa");
      const lastKelas = settings.find((s: any) => s.key === "last_selected_kelas_siswa");
      
      if (lastTingkat) {
        setSelectedTingkat(lastTingkat.value);
      }
      if (lastKelas) {
        setSelectedKelas(lastKelas.value);
      }
    } catch (error) {
      console.error("Error loading last selected class:", error);
    }
  };

  const saveLastSelectedTingkat = async (tingkat: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_tingkat_siswa");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: tingkat });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_tingkat_siswa",
          value: tingkat,
        });
      }
    } catch (error) {
      console.error("Error saving tingkat:", error);
    }
  };

  const saveLastSelectedKelas = async (kelasId: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_kelas_siswa");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: kelasId });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_kelas_siswa",
          value: kelasId,
        });
      }
    } catch (error) {
      console.error("Error saving kelas:", error);
    }
  };

  // Filter kelas berdasarkan tingkat yang dipilih
  useEffect(() => {
    if (selectedTingkat) {
      const filtered = kelas.filter(k => k.tingkat === selectedTingkat);
      setFilteredKelas(filtered);
      
      // Reset selected kelas jika tidak ada dalam tingkat yang dipilih
      if (selectedKelas && !filtered.find(k => k.id === selectedKelas)) {
        setSelectedKelas("");
      }
    } else {
      setFilteredKelas([]);
      setSelectedKelas("");
    }
  }, [selectedTingkat, kelas]);

  // Filter siswa berdasarkan kelas yang dipilih
  useEffect(() => {
    if (selectedKelas) {
      const filtered = siswa.filter(s => s.kelas_id === selectedKelas);
      setFilteredSiswa(filtered);
    } else if (selectedTingkat) {
      // Jika hanya tingkat yang dipilih, tampilkan semua siswa dari tingkat tersebut
      const kelasIds = filteredKelas.map(k => k.id);
      const filtered = siswa.filter(s => kelasIds.includes(s.kelas_id));
      setFilteredSiswa(filtered);
    } else {
      setFilteredSiswa([]);
    }
  }, [selectedKelas, selectedTingkat, siswa, filteredKelas]);

  // Get unique tingkat values
  const tingkatOptions = [...new Set(kelas.map(k => k.tingkat))].map(tingkat => ({
    value: tingkat,
    label: tingkat
  }));

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      const kelasId = formData.kelas_id || selectedKelas;
      if (!kelasId) {
        toast({
          title: "Error",
          description: "Pilih kelas terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      const result = await indexedDB.insert('siswa', {
        nis: formData.nis,
        nama_siswa: formData.nama_siswa,
        kelas_id: kelasId,
        jenis_kelamin: formData.jenis_kelamin as 'Laki-laki' | 'Perempuan',
        tanggal_lahir: formData.tanggal_lahir || undefined,
        tempat_lahir: formData.tempat_lahir || undefined,
        alamat: formData.alamat || undefined,
        nama_orang_tua: formData.nama_orang_tua || undefined,
        telepon_orang_tua: formData.telepon_orang_tua || undefined,
        email: formData.email || undefined,
        status: 'Aktif'
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Siswa baru berhasil ditambahkan",
      });

      fetchSiswa();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan siswa: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      const result = await indexedDB.update('siswa', id, {
        nis: formData.nis,
        nama_siswa: formData.nama_siswa,
        jenis_kelamin: formData.jenis_kelamin as 'Laki-laki' | 'Perempuan',
        tanggal_lahir: formData.tanggal_lahir || undefined,
        tempat_lahir: formData.tempat_lahir || undefined,
        alamat: formData.alamat || undefined,
        nama_orang_tua: formData.nama_orang_tua || undefined,
        telepon_orang_tua: formData.telepon_orang_tua || undefined,
        email: formData.email || undefined,
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil diperbarui",
      });

      fetchSiswa();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui siswa: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await indexedDB.delete('siswa', id);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Siswa berhasil dihapus",
      });

      fetchSiswa();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus siswa: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = async (data: Record<string, string>[]) => {
    if (!selectedKelas) {
      toast({
        title: "Error",
        description: "Pilih kelas terlebih dahulu sebelum import",
        variant: "destructive",
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Validasi data yang diperlukan
          if (!row.nis || !row.nama_siswa) {
            errors.push(`Baris dengan NIS "${row.nis || 'kosong'}" - NIS dan Nama Siswa harus diisi`);
            errorCount++;
            continue;
          }

          // Cek apakah NIS sudah ada
          const allSiswa = await indexedDB.select('siswa');
          const existingSiswa = allSiswa.find(s => s.nis === row.nis);
          if (existingSiswa) {
            errors.push(`NIS "${row.nis}" sudah ada dalam database`);
            errorCount++;
            continue;
          }

          // Tentukan kelas_id dari data import atau dari filter yang dipilih
          let kelasId = selectedKelas;
          if (row.kelas_nama) {
            // Cari kelas berdasarkan nama kelas
            const foundKelas = kelas.find(k => k.nama_kelas === row.kelas_nama);
            if (foundKelas) {
              kelasId = foundKelas.id;
            }
          }

          if (!kelasId) {
            errors.push(`NIS "${row.nis}" - Kelas tidak ditemukan`);
            errorCount++;
            continue;
          }

          const result = await indexedDB.insert('siswa', {
            nis: row.nis,
            nama_siswa: row.nama_siswa,
            kelas_id: kelasId,
            jenis_kelamin: (row.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki') as 'Laki-laki' | 'Perempuan',
            tanggal_lahir: row.tanggal_lahir || undefined,
            tempat_lahir: row.tempat_lahir || undefined,
            alamat: row.alamat || undefined,
            nama_orang_tua: row.nama_orang_tua || undefined,
            telepon_orang_tua: row.telepon_orang_tua || undefined,
            email: row.email || undefined,
            status: row.status || 'Aktif'
          });

          if (result.error) {
            errors.push(`NIS "${row.nis}" - ${result.error}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`NIS "${row.nis}" - ${error.message}`);
          errorCount++;
        }
      }

      // Tampilkan hasil import
      if (successCount > 0) {
        toast({
          title: "Import Berhasil",
          description: `${successCount} siswa berhasil diimport${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
        });
      }

      if (errorCount > 0 && errors.length > 0) {
        console.error('Import errors:', errors);
        toast({
          title: "Beberapa Data Gagal Diimport",
          description: `${errorCount} data gagal diimport. Periksa konsol untuk detail error.`,
          variant: "destructive",
        });
      }

      fetchSiswa();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengimport data: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Siswa" 
        description="Kelola siswa berdasarkan tingkat dan kelas"
      />
      
      {/* Dropdown Filters */}
      <div className="flex gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Tingkat Kelas</label>
          <Select value={selectedTingkat} onValueChange={(value) => {
            setSelectedTingkat(value);
            saveLastSelectedTingkat(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tingkat kelas" />
            </SelectTrigger>
            <SelectContent>
              {tingkatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Nama Kelas</label>
          <Select 
            value={selectedKelas} 
            onValueChange={(value) => {
              setSelectedKelas(value);
              saveLastSelectedKelas(value);
            }}
            disabled={!selectedTingkat}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih nama kelas" />
            </SelectTrigger>
            <SelectContent>
              {filteredKelas.map((kelas) => (
                <SelectItem key={kelas.id} value={kelas.id}>
                  {kelas.nama_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student Table */}
      {(selectedTingkat || selectedKelas) && (
        <DataTable
          data={filteredSiswa}
          columns={columns}
          searchPlaceholder="Cari nama siswa, NIS..."
          onAdd={selectedKelas ? handleAdd : undefined}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onImport={selectedKelas ? handleImport : undefined}
          loading={loading}
          formFields={formFields}
          title="Siswa"
        />
      )}

      {!selectedTingkat && (
        <div className="text-center py-8 text-muted-foreground">
          Pilih tingkat kelas untuk melihat daftar siswa
        </div>
      )}
    </div>
  );
};

export default Siswa;