import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { toast } from "@/hooks/use-toast";

const Kelas = () => {
  const [classes] = useState([
    {
      id: 1,
      nama_kelas: "X-A",
      tingkat: "10",
      jurusan: "IPA",
      wali_kelas: "Dr. Ahmad Wijaya",
      jumlah_siswa: 32,
      tahun_ajaran: "2024/2025",
      status: "Aktif"
    },
    {
      id: 2,
      nama_kelas: "XI-B",
      tingkat: "11",
      jurusan: "IPS",
      wali_kelas: "Siti Nurhaliza, S.Pd",
      jumlah_siswa: 28,
      tahun_ajaran: "2024/2025",
      status: "Aktif"
    },
  ]);

  const columns = [
    { key: "nama_kelas", label: "Nama Kelas", sortable: true },
    { key: "tingkat", label: "Tingkat", sortable: true },
    { key: "jurusan", label: "Jurusan", sortable: true },
    { key: "wali_kelas", label: "Wali Kelas", sortable: true },
    { key: "jumlah_siswa", label: "Jumlah Siswa", sortable: true },
    { key: "tahun_ajaran", label: "Tahun Ajaran", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const handleAdd = () => {
    toast({
      title: "Tambah Kelas",
      description: "Formulir tambah kelas akan dibuka",
    });
  };

  const handleEdit = (classData: any) => {
    toast({
      title: "Edit Kelas",
      description: `Mengedit data kelas: ${classData.nama_kelas}`,
    });
  };

  const handleDelete = (classData: any) => {
    toast({
      title: "Hapus Kelas",
      description: `Menghapus data kelas: ${classData.nama_kelas}`,
      variant: "destructive",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Data",
      description: "Data kelas berhasil diexport",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Data",
      description: "Memulai proses import data kelas",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Management Kelas" 
        description="Kelola data kelas dan pembagian siswa"
      />
      
      <DataTable
        title="Data Kelas"
        columns={columns}
        data={classes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
};

export default Kelas;