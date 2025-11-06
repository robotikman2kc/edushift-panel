import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, FileText, Calendar, BookOpen } from 'lucide-react';
import { PDFPreview } from '@/components/common/PDFPreview';

interface PDFFormatSettings {
  schoolInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    signatureLocation?: string;
  };
  defaultTeacher: {
    name: string;
    nip: string;
    subject: string;
    jabatan: string;
    satuan_kerja: string;
    kepala_sekolah_nama: string;
    kepala_sekolah_nip: string;
  };
  tableSettings: {
    rowHeight: number;
  };
  attendanceFormat: {
    showLogo: boolean;
    showDate: boolean;
    showSignature: boolean;
    headerColor: string;
    orientation: 'portrait' | 'landscape';
  };
  gradeFormat: {
    showLogo: boolean;
    showDate: boolean;
    showSignature: boolean;
    headerColor: string;
    orientation: 'portrait' | 'landscape';
  };
  journalFormat: {
    showLogo: boolean;
    showDate: boolean;
    showSignature: boolean;
    headerColor: string;
    orientation: 'portrait' | 'landscape';
  };
}

const FormatPDF: React.FC = () => {
  const { toast } = useToast();
  
  // Load settings from localStorage on component mount
  const loadSettings = (): PDFFormatSettings => {
    try {
      const saved = localStorage.getItem('pdfFormatSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        // Ensure all required fields exist
        return {
          schoolInfo: {
            name: parsedSettings.schoolInfo?.name || 'Sistem Informasi Sekolah',
            address: parsedSettings.schoolInfo?.address || 'Jl. Pendidikan No. 123, Kota Pendidikan',
            phone: parsedSettings.schoolInfo?.phone || '(021) 1234-5678',
            email: parsedSettings.schoolInfo?.email || 'info@sekolah.ac.id',
            logo: parsedSettings.schoolInfo?.logo,
            signatureLocation: parsedSettings.schoolInfo?.signatureLocation || 'Jakarta',
          },
          defaultTeacher: {
            name: parsedSettings.defaultTeacher?.name || '',
            nip: parsedSettings.defaultTeacher?.nip || '',
            subject: parsedSettings.defaultTeacher?.subject || '',
            jabatan: parsedSettings.defaultTeacher?.jabatan || '',
            satuan_kerja: parsedSettings.defaultTeacher?.satuan_kerja || '',
            kepala_sekolah_nama: parsedSettings.defaultTeacher?.kepala_sekolah_nama || '',
            kepala_sekolah_nip: parsedSettings.defaultTeacher?.kepala_sekolah_nip || '',
          },
          tableSettings: parsedSettings.tableSettings || {
            rowHeight: 8,
          },
          attendanceFormat: parsedSettings.attendanceFormat || {
            showLogo: true,
            showDate: true,
            showSignature: true,
            headerColor: '#22c55e',
            orientation: 'portrait',
          },
          gradeFormat: parsedSettings.gradeFormat || {
            showLogo: true,
            showDate: true,
            showSignature: true,
            headerColor: '#a855f7',
            orientation: 'portrait',
          },
          journalFormat: parsedSettings.journalFormat || {
            showLogo: true,
            showDate: true,
            showSignature: true,
            headerColor: '#3b82f6',
            orientation: 'portrait',
          },
        };
      }
    } catch (error) {
      console.error('Error loading PDF format settings:', error);
    }
    
    // Return default settings if nothing saved or error
    return {
      schoolInfo: {
        name: 'Sistem Informasi Sekolah',
        address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
        phone: '(021) 1234-5678',
        email: 'info@sekolah.ac.id',
        signatureLocation: 'Jakarta',
      },
      defaultTeacher: {
        name: '',
        nip: '',
        subject: '',
        jabatan: '',
        satuan_kerja: '',
        kepala_sekolah_nama: '',
        kepala_sekolah_nip: '',
      },
      tableSettings: {
        rowHeight: 8,
      },
    attendanceFormat: {
      showLogo: true,
      showDate: true,
      showSignature: true,
      headerColor: '#22c55e',
      orientation: 'portrait',
    },
    gradeFormat: {
      showLogo: true,
      showDate: true,
      showSignature: true,
      headerColor: '#a855f7',
      orientation: 'portrait',
    },
    journalFormat: {
      showLogo: true,
      showDate: true,
      showSignature: true,
      headerColor: '#3b82f6',
      orientation: 'portrait',
    },
    };
  };

  const [settings, setSettings] = useState<PDFFormatSettings>(loadSettings);

  const handleSave = () => {
    console.log('Saving PDF format settings:', settings); // Debug log
    
    // Save settings to localStorage
    localStorage.setItem('pdfFormatSettings', JSON.stringify(settings));
    
    // Also log what was saved
    const saved = localStorage.getItem('pdfFormatSettings');
    console.log('Settings saved to localStorage:', saved); // Debug log
    
    toast({
      title: "Pengaturan disimpan",
      description: "Format PDF telah berhasil disimpan.",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          schoolInfo: {
            ...prev.schoolInfo,
            logo: reader.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const FormatTab = ({ 
    formatType, 
    format, 
    icon: Icon, 
    title 
  }: { 
    formatType: keyof Pick<PDFFormatSettings, 'attendanceFormat' | 'gradeFormat' | 'journalFormat'>;
    format: PDFFormatSettings['attendanceFormat'];
    icon: React.ElementType;
    title: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Atur format khusus untuk laporan {title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Orientasi Halaman</Label>
            <Select
              value={format.orientation}
              onValueChange={(value: 'portrait' | 'landscape') =>
                setSettings(prev => ({
                  ...prev,
                  [formatType]: { ...prev[formatType], orientation: value },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Warna Header</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={format.headerColor}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    [formatType]: { ...prev[formatType], headerColor: e.target.value },
                  }))
                }
                className="w-20 h-10 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                type="text"
                value={format.headerColor}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    [formatType]: { ...prev[formatType], headerColor: e.target.value },
                  }))
                }
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${formatType}-logo`}>Tampilkan Logo</Label>
            <Switch
              id={`${formatType}-logo`}
              checked={format.showLogo}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  [formatType]: { ...prev[formatType], showLogo: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`${formatType}-date`}>Tampilkan Tanggal</Label>
            <Switch
              id={`${formatType}-date`}
              checked={format.showDate}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  [formatType]: { ...prev[formatType], showDate: checked },
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`${formatType}-signature`}>Tempat Tanda Tangan</Label>
            <Switch
              id={`${formatType}-signature`}
              checked={format.showSignature}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  [formatType]: { ...prev[formatType], showSignature: checked },
                }))
              }
            />
          </div>
        </div>
      </CardContent>
      
      <PDFPreview 
        settings={{
          schoolInfo: settings.schoolInfo,
          defaultTeacher: settings.defaultTeacher,
          format: format,
        }}
        title={title}
      />
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Format PDF" />
      
      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="school">Info Sekolah</TabsTrigger>
          <TabsTrigger value="teacher">Data Guru</TabsTrigger>
          <TabsTrigger value="table">Tabel</TabsTrigger>
          <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
          <TabsTrigger value="grades">Penilaian</TabsTrigger>
          <TabsTrigger value="journal">Jurnal</TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Sekolah</CardTitle>
              <CardDescription>
                Atur informasi sekolah yang akan tampil di header laporan PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school-name">Nama Sekolah</Label>
                  <Input
                    id="school-name"
                    value={settings.schoolInfo.name}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        schoolInfo: { ...prev.schoolInfo, name: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-phone">Telepon</Label>
                  <Input
                    id="school-phone"
                    value={settings.schoolInfo.phone}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        schoolInfo: { ...prev.schoolInfo, phone: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-email">Email</Label>
                  <Input
                    id="school-email"
                    type="email"
                    value={settings.schoolInfo.email}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        schoolInfo: { ...prev.schoolInfo, email: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-logo">Logo Sekolah</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="school-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('school-logo')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                    {settings.schoolInfo.logo && (
                      <img
                        src={settings.schoolInfo.logo}
                        alt="Logo"
                        className="h-10 w-10 object-contain border rounded"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature-location">Lokasi Tanda Tangan</Label>
                <Input
                  id="signature-location"
                  value={settings.schoolInfo.signatureLocation ?? ''}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      schoolInfo: { ...prev.schoolInfo, signatureLocation: e.target.value },
                    }))
                  }
                  placeholder="Contoh: Jakarta, Bandung, Surabaya"
                />
                <p className="text-xs text-muted-foreground">
                  Lokasi ini akan muncul di bagian tanda tangan pada PDF
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-address">Alamat</Label>
                <Textarea
                  id="school-address"
                  value={settings.schoolInfo.address}
                  onChange={(e) =>
                    setSettings(prev => ({
                      ...prev,
                      schoolInfo: { ...prev.schoolInfo, address: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <CardTitle>Data Guru & Penandatangan</CardTitle>
              <CardDescription>
                Atur data guru dan penandatangan yang akan ditampilkan di laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Nama Guru/Penandatangan</Label>
                  <Input
                    id="teacher-name"
                    placeholder="Masukkan nama lengkap"
                    value={settings.defaultTeacher.name}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, name: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-nip">NIP</Label>
                  <Input
                    id="teacher-nip"
                    placeholder="Masukkan NIP"
                    value={settings.defaultTeacher.nip}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, nip: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-subject">Mata Pelajaran</Label>
                  <Input
                    id="teacher-subject"
                    placeholder="Masukkan mata pelajaran"
                    value={settings.defaultTeacher.subject}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, subject: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-position">Jabatan</Label>
                  <Input
                    id="teacher-position"
                    placeholder="Misal: Kepala Sekolah, Wali Kelas, dll"
                    value={settings.defaultTeacher.jabatan}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, jabatan: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-work-unit">Satuan Kerja</Label>
                  <Input
                    id="teacher-work-unit"
                    placeholder="Misal: SD Negeri 1, SMP Negeri 2, dll"
                    value={settings.defaultTeacher.satuan_kerja}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, satuan_kerja: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4">Data Kepala Sekolah</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal-name">Nama Kepala Sekolah</Label>
                    <Input
                      id="principal-name"
                      placeholder="Masukkan nama kepala sekolah"
                      value={settings.defaultTeacher.kepala_sekolah_nama}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          defaultTeacher: { ...prev.defaultTeacher, kepala_sekolah_nama: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal-nip">NIP Kepala Sekolah</Label>
                    <Input
                      id="principal-nip"
                      placeholder="Masukkan NIP kepala sekolah"
                      value={settings.defaultTeacher.kepala_sekolah_nip}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          defaultTeacher: { ...prev.defaultTeacher, kepala_sekolah_nip: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Tanda Tangan</CardTitle>
              <CardDescription>
                Konfigurasi siapa yang menandatangani setiap jenis laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Laporan Kehadiran</h5>
                  <p className="text-xs text-muted-foreground">
                    Ditandatangani oleh: <strong>Guru dengan jabatan tertentu</strong> 
                    (sesuai data guru di atas)
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Laporan Penilaian</h5>
                  <p className="text-xs text-muted-foreground">
                    Ditandatangani oleh: <strong>Guru dengan jabatan tertentu</strong> 
                    (sesuai data guru di atas)
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Laporan Jurnal</h5>
                  <p className="text-xs text-muted-foreground">
                    Ditandatangani oleh: <strong>Pejabat Penilai (Kepala Sekolah)</strong> dan <strong>Pegawai Yang Dinilai (Guru)</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Tabel</CardTitle>
              <CardDescription>
                Atur tampilan tabel pada semua laporan PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Tinggi Baris PDF</h3>
                <div className="space-y-2">
                  <Label htmlFor="row-height">Tinggi Baris untuk Cetak PDF</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="row-height"
                      type="number"
                      min="6"
                      max="20"
                      step="1"
                      value={settings.tableSettings.rowHeight}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          tableSettings: { ...prev.tableSettings, rowHeight: Number(e.target.value) },
                        }))
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      Nilai: {settings.tableSettings.rowHeight} (Default: 8)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Semakin besar nilai, semakin tinggi baris tabel pada PDF yang dicetak. Rentang: 6-20
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Panduan Tinggi Baris PDF:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>6-7</strong>: Baris sangat rapat (untuk data banyak)</li>
                    <li>• <strong>8-10</strong>: Baris standar (default, direkomendasikan)</li>
                    <li>• <strong>11-15</strong>: Baris lebih longgar (lebih mudah dibaca)</li>
                    <li>• <strong>16-20</strong>: Baris sangat longgar (untuk data sedikit)</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Info:</strong> Tinggi baris tabel di aplikasi dapat diatur langsung pada setiap tabel menggunakan menu dropdown yang tersedia di bagian atas tabel.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <FormatTab
            formatType="attendanceFormat"
            format={settings.attendanceFormat}
            icon={Calendar}
            title="Laporan Kehadiran"
          />
        </TabsContent>

        <TabsContent value="grades">
          <FormatTab
            formatType="gradeFormat"
            format={settings.gradeFormat}
            icon={FileText}
            title="Laporan Penilaian"
          />
        </TabsContent>

        <TabsContent value="journal">
          <FormatTab
            formatType="journalFormat"
            format={settings.journalFormat}
            icon={BookOpen}
            title="Laporan Jurnal Guru"
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
};

export default FormatPDF;