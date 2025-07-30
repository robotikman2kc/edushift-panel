import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { supabase } from "@/integrations/supabase/client";
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
      const { data: guru, error } = await supabase
        .from("guru")
        .select("*")
        .order("nama_guru", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengambil data guru",
          variant: "destructive",
        });
        return;
      }

      // Add row numbers to data
      const dataWithNumbers = guru?.map((item, index) => ({
        ...item,
        no: (index + 1).toString(),
      })) || [];

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
      const { error } = await supabase.from("guru").insert([
        {
          nama_guru: formData.nama_guru,
          nip: formData.nip,
          mata_pelajaran: formData.mata_pelajaran,
          email: formData.email,
          telepon: formData.telepon,
        },
      ]);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
      const { error } = await supabase
        .from("guru")
        .update({
          nama_guru: formData.nama_guru,
          nip: formData.nip,
          mata_pelajaran: formData.mata_pelajaran,
          email: formData.email,
          telepon: formData.telepon,
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
      const { error } = await supabase.from("guru").delete().eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
        loading={loading}
        formFields={formFields}
        searchPlaceholder="Cari nama guru, NIP, atau mata pelajaran..."
      />
    </div>
  );
};

export default Guru;