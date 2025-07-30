import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'guru';
  status: string;
  created_at: string;
}

const User = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "nama", label: "Nama", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "created_at", label: "Tanggal Dibuat", sortable: true },
  ];

  const formFields = [
    { key: "nama", label: "Nama Lengkap", type: "text" as const, placeholder: "Masukkan nama lengkap", required: true },
    { key: "email", label: "Email", type: "email" as const, placeholder: "Masukkan email", required: true },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format the data to match the expected structure
      const formattedData = data?.map(user => ({
        ...user,
        created_at: new Date(user.created_at).toLocaleDateString('id-ID')
      })) || [];

      setUsers(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data user: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'TempPass123!', // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then create user record
        const { error: userError } = await supabase
          .from('users')
          .insert({
            user_id: authData.user.id,
            nama: formData.nama,
            email: formData.email,
            role: 'guru', // Default role
          });

        if (userError) throw userError;

        toast({
          title: "Berhasil",
          description: "User baru berhasil ditambahkan",
        });

        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan user: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nama: formData.nama,
          email: formData.email,
          // role cannot be edited through this form
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data user berhasil diperbarui",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui user: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "User berhasil dihapus",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus user: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar User" 
        description="Kelola data pengguna sistem"
      />
      
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Cari nama, email, atau role..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        formFields={formFields}
        title="User"
      />
    </div>
  );
};

export default User;