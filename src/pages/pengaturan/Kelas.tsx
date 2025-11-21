import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { indexedDB } from "@/lib/indexedDB";
import { toast } from "@/hooks/use-toast";
import { getAllTahunAjaranWithUpcoming, getActiveTahunAjaran } from "@/lib/academicYearUtils";

interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  wali_kelas_id?: string;
  wali_kelas?: {
    nama_guru: string;
  };
  tahun_ajaran: string;
  kapasitas: number;
  status: string;
  created_at: string;
}

interface Guru {
  id: string;
  nama_guru: string;
}

const Kelas = () => {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<Kelas[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  const columns = [
    { key: "nama_kelas", label: "Nama Kelas", sortable: true },
    { key: "tingkat", label: "Tingkat", sortable: true },
    { key: "wali_kelas_nama", label: "Wali Kelas", sortable: false },
    { key: "tahun_ajaran", label: "Tahun Ajaran", sortable: true },
    { key: "kapasitas", label: "Kapasitas", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const formFields = [
    { key: "nama_kelas", label: "Nama Kelas", type: "text" as const, placeholder: "Contoh: X IPA 1", required: true },
    { key: "tingkat", label: "Tingkat", type: "select" as const, placeholder: "Pilih tingkat", required: true, options: [
      { value: "X", label: "X" },
      { value: "XI", label: "XI" },
      { value: "XII", label: "XII" }
    ]},
    { key: "wali_kelas_id", label: "Wali Kelas", type: "select" as const, placeholder: "Pilih wali kelas", required: false, options: guru.map(g => ({ value: g.id, label: g.nama_guru })) },
    { key: "tahun_ajaran", label: "Tahun Ajaran", type: "text" as const, placeholder: "Contoh: 2024/2025", required: true },
    { key: "kapasitas", label: "Kapasitas", type: "number" as const, placeholder: "Masukkan kapasitas", required: true },
  ];

  const fetchGuru = async () => {
    try {
      const data = await indexedDB.select('guru');
      const guruData = data.map(g => ({ id: g.id, nama_guru: g.nama_guru }));
      setGuru(guruData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data guru: " + error,
        variant: "destructive",
      });
    }
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const data = await indexedDB.select('kelas');
      const allGuru = await indexedDB.select('guru');

      // Format the data to match the expected structure
      const formattedData = data.map(item => {
        const waliKelas = allGuru.find(g => g.id === item.wali_kelas_id);
        return {
          ...item,
          wali_kelas_nama: waliKelas?.nama_guru || 'Belum ditentukan',
          created_at: new Date(item.created_at).toLocaleDateString('id-ID')
        };
      });

      setKelas(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data kelas: " + error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru();
    fetchKelas();
    loadAvailableYears();
    loadLastSelectedYear();
  }, []);

  const loadAvailableYears = async () => {
    try {
      const years = await getAllTahunAjaranWithUpcoming(3);
      setAvailableYears(years);
    } catch (error) {
      console.error("Error loading tahun ajaran:", error);
    }
  };

  const loadLastSelectedYear = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const lastYear = settings.find((s: any) => s.key === "last_selected_year_kelas");
      
      if (lastYear) {
        setSelectedYear(lastYear.value);
      } else {
        const activeYear = await getActiveTahunAjaran();
        setSelectedYear(activeYear);
      }
    } catch (error) {
      console.error("Error loading last selected year:", error);
    }
  };

  const saveLastSelectedYear = async (year: string) => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const existing = settings.find((s: any) => s.key === "last_selected_year_kelas");
      
      if (existing) {
        await indexedDB.update("pengaturan", existing.id, { value: year });
      } else {
        await indexedDB.insert("pengaturan", {
          key: "last_selected_year_kelas",
          value: year,
        });
      }
    } catch (error) {
      console.error("Error saving year:", error);
    }
  };

  // Filter kelas berdasarkan tahun ajaran yang dipilih
  useEffect(() => {
    if (selectedYear && kelas.length > 0) {
      const filtered = kelas.filter(k => k.tahun_ajaran === selectedYear);
      setFilteredKelas(filtered);
    } else {
      setFilteredKelas(kelas);
    }
  }, [selectedYear, kelas]);

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      // Parse kapasitas safely
      const kapasitas = formData.kapasitas ? parseInt(formData.kapasitas) : 0;
      
      const result = await indexedDB.insert('kelas', {
        nama_kelas: formData.nama_kelas,
        tingkat: formData.tingkat,
        wali_kelas_id: formData.wali_kelas_id || undefined,
        tahun_ajaran: formData.tahun_ajaran,
        kapasitas: isNaN(kapasitas) ? 0 : kapasitas,
        status: 'Aktif'
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Kelas baru berhasil ditambahkan",
      });

      fetchKelas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan kelas: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      // Parse kapasitas safely
      const kapasitas = formData.kapasitas ? parseInt(formData.kapasitas) : 0;
      
      const result = await indexedDB.update('kelas', id, {
        nama_kelas: formData.nama_kelas,
        tingkat: formData.tingkat,
        wali_kelas_id: formData.wali_kelas_id || undefined,
        tahun_ajaran: formData.tahun_ajaran,
        kapasitas: isNaN(kapasitas) ? 0 : kapasitas,
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Data kelas berhasil diperbarui",
      });

      fetchKelas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui kelas: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await indexedDB.delete('kelas', id);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Kelas berhasil dihapus",
      });

      fetchKelas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus kelas: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Kelas" 
        description="Kelola data kelas dan wali kelas"
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="tahun-ajaran">Filter Tahun Ajaran</Label>
              <Select value={selectedYear} onValueChange={(value) => {
                setSelectedYear(value);
                saveLastSelectedYear(value);
              }}>
                <SelectTrigger id="tahun-ajaran">
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            data={filteredKelas}
            columns={columns}
            searchPlaceholder="Cari nama kelas atau tingkat..."
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDeleteBulk={async (ids) => {
              for (const id of ids) {
                await handleDelete(id);
              }
            }}
            loading={loading}
            formFields={formFields}
            title="Daftar Kelas"
            tableId="kelas"
            enableCheckbox={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Kelas;