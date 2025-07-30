import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { supabase } from "@/integrations/supabase/client";
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
}

const Siswa = () => {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
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
    { key: "kelas_id", label: "Kelas", type: "select" as const, placeholder: "Pilih kelas", required: true, options: kelas.map(k => ({ value: k.id, label: k.nama_kelas })) },
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
        .select('id, nama_kelas')
        .order('nama_kelas');

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
            nama_kelas
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to match the expected structure
      const formattedData = data?.map(item => ({
        ...item,
        jenis_kelamin: item.jenis_kelamin as 'Laki-laki' | 'Perempuan',
        kelas_nama: item.kelas?.nama_kelas || 'Tidak ada kelas',
        tanggal_lahir: item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '',
        created_at: new Date(item.created_at).toLocaleDateString('id-ID')
      })) || [];

      setSiswa(formattedData);
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

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      const { error } = await supabase
        .from('siswa')
        .insert({
          nis: formData.nis,
          nama_siswa: formData.nama_siswa,
          kelas_id: formData.kelas_id,
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
          kelas_id: formData.kelas_id,
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
        title="Daftar Siswa" 
        description="Kelola data siswa berdasarkan kelas"
      />
      
      <DataTable
        data={siswa}
        columns={columns}
        searchPlaceholder="Cari nama siswa, NIS, atau kelas..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        formFields={formFields}
        title="Siswa"
      />
    </div>
  );
};

export default Siswa;