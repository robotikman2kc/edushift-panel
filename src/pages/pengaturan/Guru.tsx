import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { toast } from "@/hooks/use-toast";

const Guru = () => {
  const [teachers] = useState([
    {
      id: 1,
      nip: "123456789",
      nama: "Dr. Ahmad Wijaya",
      mata_pelajaran: "Matematika",
      kelas: "X-A, X-B",
      email: "ahmad.wijaya@sekolah.com",
      telepon: "081234567890",
      status: "Aktif"
    },
    {
      id: 2,
      nip: "987654321",
      nama: "Siti Nurhaliza, S.Pd",
      mata_pelajaran: "Bahasa Indonesia",
      kelas: "XI-A, XI-C",
      email: "siti.nurhaliza@sekolah.com",
      telepon: "081987654321",
      status: "Aktif"
    },
  ]);

  const columns = [
    { key: "nip", label: "NIP", sortable: true },
    { key: "nama", label: "Nama Guru", sortable: true },
    { key: "mata_pelajaran", label: "Mata Pelajaran", sortable: true },
    { key: "kelas", label: "Kelas", sortable: false },
    { key: "email", label: "Email", sortable: false },
    { key: "telepon", label: "Telepon", sortable: false },
    { key: "status", label: "Status", sortable: true },
  ];

  const handleAdd = () => {
    toast({
      title: "Tambah Guru",
      description: "Formulir tambah guru akan dibuka",
    });
  };

  const handleEdit = (teacher: any) => {
    toast({
      title: "Edit Guru",
      description: `Mengedit data guru: ${teacher.nama}`,
    });
  };

  const handleDelete = (teacher: any) => {
    toast({
      title: "Hapus Guru",
      description: `Menghapus data guru: ${teacher.nama}`,
      variant: "destructive",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Data",
      description: "Data guru berhasil diexport",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Data",
      description: "Memulai proses import data guru",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar Guru" 
        description="Kelola data guru dan tenaga pendidik"
      />
      
      <DataTable
        title="Data Guru"
        columns={columns}
        data={teachers}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
};

export default Guru;