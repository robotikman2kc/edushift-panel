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
  };
  defaultTeacher: {
    name: string;
    nip: string;
    subject: string;
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
  const [settings, setSettings] = useState<PDFFormatSettings>({
    schoolInfo: {
      name: 'Sistem Informasi Sekolah',
      address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
      phone: '(021) 1234-5678',
      email: 'info@sekolah.ac.id',
    },
    defaultTeacher: {
      name: '',
      nip: '',
      subject: '',
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
  });

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
            <Input
              type="color"
              value={format.headerColor}
              onChange={(e) =>
                setSettings(prev => ({
                  ...prev,
                  [formatType]: { ...prev[formatType], headerColor: e.target.value },
                }))
              }
            />
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="school">Info Sekolah</TabsTrigger>
          <TabsTrigger value="teacher">Data Guru</TabsTrigger>
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
              <CardTitle>Data Guru Default</CardTitle>
              <CardDescription>
                Atur data guru default yang akan ditampilkan di laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Nama Guru</Label>
                  <Input
                    id="teacher-name"
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
                    value={settings.defaultTeacher.nip}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, nip: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="teacher-subject">Mata Pelajaran</Label>
                  <Input
                    id="teacher-subject"
                    value={settings.defaultTeacher.subject}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        defaultTeacher: { ...prev.defaultTeacher, subject: e.target.value },
                      }))
                    }
                  />
                </div>
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