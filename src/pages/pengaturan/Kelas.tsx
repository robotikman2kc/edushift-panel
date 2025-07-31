import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Siswa {
  id: string;
  nis: string;
  nama_siswa: string;
  kelas_id: string;
  kelas?: {
    nama_kelas: string;
    tingkat: string;
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
  jurusan: string;
  wali_kelas_id?: string;
  wali_kelas?: {
    nama_guru: string;
  };
  tahun_ajaran: string;
  kapasitas: number;
  status: string;
  created_at: string;
}

const Kelas = () => {
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
    { key: "jenis_kelamin", label: "Jenis Kelamin", sortable: true },
    { key: "nama_orang_tua", label: "Orang Tua", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const formFields = [
    { key: "nis", label: "NIS", type: "text" as const, placeholder: "Masukkan NIS", required: true },
    { key: "nama_siswa", label: "Nama Siswa", type: "text" as const, placeholder: "Masukkan nama siswa", required: true },
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
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat, nama_kelas');

      if (error) throw error;
      setKelas(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data kelas: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSiswa = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('siswa')
        .select(`
          *,
          kelas:kelas_id (
            nama_kelas,
            tingkat
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to match the expected structure
      const formattedData = data?.map(item => ({
        ...item,
        jenis_kelamin: item.jenis_kelamin as 'Laki-laki' | 'Perempuan',
        tanggal_lahir: item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '',
        created_at: new Date(item.created_at).toLocaleDateString('id-ID')
      })) || [];

      setSiswa(formattedData);
      setFilteredSiswa(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data siswa: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchSiswa();
  }, []);

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
      const filtered = siswa.filter(s => s.kelas?.tingkat === selectedTingkat);
      setFilteredSiswa(filtered);
    } else {
      setFilteredSiswa([]);
    }
  }, [selectedKelas, selectedTingkat, siswa]);

  // Get unique tingkat values
  const tingkatOptions = [...new Set(kelas.map(k => k.tingkat))].map(tingkat => ({
    value: tingkat,
    label: tingkat
  }));

  const handleAdd = async (formData: Record<string, string>) => {
    if (!selectedKelas) {
      toast({
        title: "Error",
        description: "Pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('siswa')
        .insert({
          nis: formData.nis,
          nama_siswa: formData.nama_siswa,
          kelas_id: selectedKelas,
          jenis_kelamin: formData.jenis_kelamin as 'Laki-laki' | 'Perempuan',
          tanggal_lahir: formData.tanggal_lahir || null,
          tempat_lahir: formData.tempat_lahir || null,
          alamat: formData.alamat || null,
          nama_orang_tua: formData.nama_orang_tua || null,
          telepon_orang_tua: formData.telepon_orang_tua || null,
          email: formData.email || null,
        });

      if (error) throw error;

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
      const { error } = await supabase
        .from('siswa')
        .update({
          nis: formData.nis,
          nama_siswa: formData.nama_siswa,
          jenis_kelamin: formData.jenis_kelamin as 'Laki-laki' | 'Perempuan',
          tanggal_lahir: formData.tanggal_lahir || null,
          tempat_lahir: formData.tempat_lahir || null,
          alamat: formData.alamat || null,
          nama_orang_tua: formData.nama_orang_tua || null,
          telepon_orang_tua: formData.telepon_orang_tua || null,
          email: formData.email || null,
        })
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Kelas" 
        description="Kelola siswa berdasarkan tingkat dan kelas"
      />
      
      {/* Dropdown Filters */}
      <div className="flex gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Tingkat Kelas</label>
          <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
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
            onValueChange={setSelectedKelas}
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

export default Kelas;