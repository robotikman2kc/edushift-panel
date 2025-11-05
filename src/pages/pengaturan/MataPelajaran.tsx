import { useState, useEffect } from "react";
import { indexedDB } from "@/lib/indexedDB";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { useToast } from "@/hooks/use-toast";

interface MataPelajaran {
  id: string;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  deskripsi: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const MataPelajaran = () => {
  const [data, setData] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const columns = [
    { key: "no", label: "No", sortable: false },
    { key: "nama_mata_pelajaran", label: "Nama Mata Pelajaran", sortable: true },
    { key: "kode_mata_pelajaran", label: "Kode", sortable: true },
    { key: "deskripsi", label: "Deskripsi", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const mataPelajaran = await indexedDB.select("mata_pelajaran");
      const sortedData = mataPelajaran.sort((a, b) => a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran));

      setData(sortedData);
    } catch (error) {
      console.error("Error fetching mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mata pelajaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (formData: any) => {
    try {
      const result = await indexedDB.insert("mata_pelajaran", {
        nama_mata_pelajaran: formData.nama_mata_pelajaran,
        kode_mata_pelajaran: formData.kode_mata_pelajaran,
        deskripsi: formData.deskripsi,
        status: formData.status || "Aktif",
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Data mata pelajaran berhasil ditambahkan",
      });

      fetchData();
    } catch (error) {
      console.error("Error adding mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: any) => {
    try {
      const result = await indexedDB.update("mata_pelajaran", id, {
        nama_mata_pelajaran: formData.nama_mata_pelajaran,
        kode_mata_pelajaran: formData.kode_mata_pelajaran,
        deskripsi: formData.deskripsi,
        status: formData.status,
      });

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Data mata pelajaran berhasil diperbarui",
      });

      fetchData();
    } catch (error) {
      console.error("Error updating mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await indexedDB.delete("mata_pelajaran", id);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Berhasil",
        description: "Data mata pelajaran berhasil dihapus",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const formFields = [
    {
      key: "nama_mata_pelajaran",
      label: "Nama Mata Pelajaran",
      type: "text" as const,
      placeholder: "Masukkan nama mata pelajaran",
      required: true,
    },
    {
      key: "kode_mata_pelajaran",
      label: "Kode Mata Pelajaran",
      type: "text" as const,
      placeholder: "Masukkan kode mata pelajaran",
      required: true,
    },
    {
      key: "deskripsi",
      label: "Deskripsi",
      type: "text" as const,
      placeholder: "Masukkan deskripsi mata pelajaran",
      required: false,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "Aktif", label: "Aktif" },
        { value: "Tidak Aktif", label: "Tidak Aktif" },
      ],
      required: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mata Pelajaran" 
        description="Kelola data mata pelajaran sekolah"
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
        loading={loading}
        formFields={formFields}
        searchPlaceholder="Cari nama mata pelajaran atau kode..."
        title="Mata Pelajaran"
        enableCheckbox={true}
      />
    </div>
  );
};

export default MataPelajaran;