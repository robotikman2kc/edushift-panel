import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { indexedDB } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";

interface Guru {
  id: string;
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  email: string;
  telepon: string;
  created_at: string;
  updated_at: string;
}

const Guru = () => {
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const columns = [
    { key: "no", label: "No", sortable: false },
    { key: "nama_guru", label: "Nama Guru", sortable: true },
    { key: "nip", label: "NIP", sortable: true },
    { key: "mata_pelajaran", label: "Mata Pelajaran", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "telepon", label: "Telepon", sortable: true },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const guru = await indexedDB.select('guru');
      
      // Add row numbers to data
      const dataWithNumbers = guru.map((item, index) => ({
        ...item,
        no: (index + 1).toString(),
      }));

      setData(dataWithNumbers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      const result = await indexedDB.insert('guru', {
        nama_guru: formData.nama_guru,
        nip: formData.nip,
        mata_pelajaran: formData.mata_pelajaran,
        email: formData.email,
        telepon: formData.telepon,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sukses",
        description: "Data guru berhasil ditambahkan",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menambahkan data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      const result = await indexedDB.update('guru', id, {
        nama_guru: formData.nama_guru,
        nip: formData.nip,
        mata_pelajaran: formData.mata_pelajaran,
        email: formData.email,
        telepon: formData.telepon,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sukses",
        description: "Data guru berhasil diperbarui",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui data",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await indexedDB.delete('guru', id);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sukses",
        description: "Data guru berhasil dihapus",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (data: Record<string, string>[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Validasi data yang diperlukan
          if (!row.nama_guru || !row.nip) {
            errors.push(`Baris dengan NIP "${row.nip || 'kosong'}" - Nama Guru dan NIP harus diisi`);
            errorCount++;
            continue;
          }

          // Cek apakah NIP sudah ada
          const allGuru = await indexedDB.select('guru');
          const existingGuru = allGuru.find(g => g.nip === row.nip);
          if (existingGuru) {
            errors.push(`NIP "${row.nip}" sudah ada dalam database`);
            errorCount++;
            continue;
          }

          const result = await indexedDB.insert('guru', {
            nama_guru: row.nama_guru,
            nip: row.nip,
            mata_pelajaran: row.mata_pelajaran || '',
            email: row.email || '',
            telepon: row.telepon || '',
          });

          if (result.error) {
            errors.push(`NIP "${row.nip}" - ${result.error}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`NIP "${row.nip}" - ${error.message}`);
          errorCount++;
        }
      }

      // Tampilkan hasil import
      if (successCount > 0) {
        toast({
          title: "Import Berhasil",
          description: `${successCount} guru berhasil diimport${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
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

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengimport data: " + error.message,
        variant: "destructive",
      });
    }
  };

  const formFields = [
    {
      key: "nama_guru",
      label: "Nama Guru",
      type: "text" as const,
      placeholder: "Masukkan nama guru",
      required: true,
    },
    {
      key: "nip",
      label: "NIP",
      type: "text" as const,
      placeholder: "Masukkan NIP",
      required: true,
    },
    {
      key: "mata_pelajaran",
      label: "Mata Pelajaran",
      type: "text" as const,
      placeholder: "Masukkan mata pelajaran",
      required: true,
    },
    {
      key: "email",
      label: "Email",
      type: "email" as const,
      placeholder: "Masukkan email",
      required: true,
    },
    {
      key: "telepon",
      label: "Telepon",
      type: "text" as const,
      placeholder: "Masukkan nomor telepon",
      required: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Guru" 
        description="Kelola data guru dan informasi mengajar"
      />
      
      <DataTable
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteBulk={async (ids) => {
          for (const id of ids) {
            await handleDelete(id);
          }
        }}
        onImport={handleImport}
        loading={loading}
        formFields={formFields}
        searchPlaceholder="Cari nama guru, NIP, atau mata pelajaran..."
        title="Guru"
        enableCheckbox={true}
      />
    </div>
  );
};

export default Guru;