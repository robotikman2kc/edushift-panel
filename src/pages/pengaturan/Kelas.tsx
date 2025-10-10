import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { indexedDB } from "@/lib/indexedDB";
import { toast } from "@/hooks/use-toast";

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
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      const result = await indexedDB.insert('kelas', {
        nama_kelas: formData.nama_kelas,
        tingkat: formData.tingkat,
        wali_kelas_id: formData.wali_kelas_id || undefined,
        tahun_ajaran: formData.tahun_ajaran,
        kapasitas: parseInt(formData.kapasitas),
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
      const result = await indexedDB.update('kelas', id, {
        nama_kelas: formData.nama_kelas,
        tingkat: formData.tingkat,
        wali_kelas_id: formData.wali_kelas_id || undefined,
        tahun_ajaran: formData.tahun_ajaran,
        kapasitas: parseInt(formData.kapasitas),
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
      
      <DataTable
        data={kelas}
        columns={columns}
        searchPlaceholder="Cari nama kelas atau tingkat..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        formFields={formFields}
        title="Kelas"
      />
    </div>
  );
};

export default Kelas;