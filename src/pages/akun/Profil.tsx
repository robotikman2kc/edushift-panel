import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Camera, Upload, Phone, MapPin, Calendar as CalendarIcon, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { opfsStorage } from "@/lib/opfsStorage";

interface UserProfile {
  nama: string;
  email: string;
  avatar_url?: string;
  telepon?: string;
  alamat?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  bio?: string;
  jenis_kelamin?: 'Laki-laki' | 'Perempuan';
}

const Profil = () => {
  const [profile, setProfile] = useState<UserProfile>({
    nama: "",
    email: "",
    telepon: "",
    alamat: "",
    tanggal_lahir: "",
    tempat_lahir: "",
    bio: "",
    jenis_kelamin: undefined,
    avatar_url: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        
        // Selalu load avatar dari OPFS jika menggunakan opfs://
        if (parsed.avatar_url) {
          if (parsed.avatar_url.startsWith('opfs://')) {
            console.log('Loading avatar from OPFS:', parsed.avatar_url);
            const opfsUrl = await opfsStorage.getFile(parsed.avatar_url);
            if (opfsUrl) {
              console.log('Avatar loaded successfully:', opfsUrl);
              setProfile({ ...parsed, avatar_url: opfsUrl });
            } else {
              console.error('Failed to load avatar from OPFS');
              // Set profile without avatar if OPFS fails
              setProfile({ ...parsed, avatar_url: '' });
            }
            return;
          } else if (parsed.avatar_url.startsWith('data:')) {
            // Migrate dari base64 ke OPFS
            const userId = 'default-user';
            const migratedPath = await opfsStorage.migrateFromBase64(
              parsed.avatar_url,
              `avatars/${userId}.jpg`
            );
            
            if (migratedPath.startsWith('opfs://')) {
              parsed.avatar_url = migratedPath;
              localStorage.setItem('userProfile', JSON.stringify(parsed));
              
              const opfsUrl = await opfsStorage.getFile(migratedPath);
              if (opfsUrl) {
                setProfile({ ...parsed, avatar_url: opfsUrl });
                return;
              }
            }
          }
        }
        
        setProfile(parsed);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setIsEditing(false);
      
      // Trigger custom event to update other components
      window.dispatchEvent(new Event('profileUpdated'));
      
      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan profil",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 2MB",
        variant: "destructive"
      });
      return;
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Get user ID (default untuk sekarang)
      const userId = 'default-user';
      
      // Simpan ke OPFS
      const avatarPath = await opfsStorage.saveFile(
        `avatars/${userId}.jpg`,
        file
      );
      
      if (!avatarPath) {
        throw new Error('Failed to save avatar');
      }
      
      console.log('Avatar saved to OPFS:', avatarPath);
      
      // PENTING: Simpan OPFS path (bukan blob URL) ke localStorage
      const updatedProfile = { ...profile, avatar_url: avatarPath };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      console.log('Profile saved to localStorage:', updatedProfile);
      
      // Untuk preview, load blob URL dari OPFS
      const previewUrl = avatarPath.startsWith('opfs://') 
        ? await opfsStorage.getFile(avatarPath)
        : avatarPath;
      
      console.log('Preview URL generated:', previewUrl);
      
      // Update state dengan preview URL untuk display
      setProfile({ ...profile, avatar_url: previewUrl || '' });
      
      // Trigger custom event to update other components
      window.dispatchEvent(new Event('profileUpdated'));
      
      toast({
        title: "Berhasil",
        description: "Foto profil berhasil diperbarui"
      });
      
      setIsUploadingAvatar(false);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Gagal mengunggah foto profil",
        variant: "destructive"
      });
      setIsUploadingAvatar(false);
    } finally {
      event.target.value = '';
    }
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Profil" 
        description="Kelola informasi profil Anda"
      />

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Profil
            </CardTitle>
            <CardDescription>
              Kelola informasi dasar profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={profile.avatar_url} alt={profile.nama} />
                <AvatarFallback className="text-lg">
                  {profile.nama ? profile.nama.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">Foto Profil</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload foto profil Anda (JPG, PNG, maksimal 2MB)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Upload className="mr-2 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-3 w-3" />
                        Upload Foto
                      </>
                    )}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={profile.nama}
                    onChange={(e) => setProfile(prev => ({ ...prev, nama: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telepon">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telepon"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={profile.telepon || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, telepon: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                  <Select
                    value={profile.jenis_kelamin || ""}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, jenis_kelamin: value as 'Laki-laki' | 'Perempuan' }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="jenis_kelamin">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tempat_lahir"
                      placeholder="Jakarta"
                      value={profile.tempat_lahir || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, tempat_lahir: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tanggal_lahir"
                      type="date"
                      value={profile.tanggal_lahir || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="alamat"
                    placeholder="Masukkan alamat lengkap"
                    value={profile.alamat || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, alamat: e.target.value }))}
                    disabled={!isEditing}
                    className="pl-10 min-h-20"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Deskripsi</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    placeholder="Ceritakan tentang diri Anda"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    className="pl-10 min-h-24"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profil
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Save className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profil;