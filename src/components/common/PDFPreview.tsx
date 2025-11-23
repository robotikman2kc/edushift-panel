import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface PDFPreviewProps {
  settings: {
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
      jabatan_sekolah: string;
      jabatan_kepegawaian: string;
    };
    format: {
      showLogo: boolean;
      showDate: boolean;
      showSignature: boolean;
      headerColor: string;
      orientation: 'portrait' | 'landscape';
    };
  };
  title: string;
  sampleData?: any[];
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ settings, title, sampleData = [] }) => {
  const { schoolInfo, defaultTeacher, format } = settings;
  
  const previewWidth = format.orientation === 'portrait' ? 'w-64' : 'w-80';
  const previewHeight = format.orientation === 'portrait' ? 'h-80' : 'h-64';

  // Sample table data based on report type
  const getSampleData = () => {
    if (title.includes('Kehadiran')) {
      return [
        ['No', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha'],
        ['1', 'Ahmad Fajar', '20', '1', '0', '0'],
        ['2', 'Siti Nurhaliza', '19', '0', '1', '1'],
        ['3', 'Budi Santoso', '21', '0', '0', '0'],
      ];
    } else if (title.includes('Penilaian')) {
      return [
        ['No', 'Nama Siswa', 'Tugas', 'UTS', 'UAS', 'Nilai Akhir'],
        ['1', 'Ahmad Fajar', '85', '78', '80', '81'],
        ['2', 'Siti Nurhaliza', '90', '85', '88', '88'],
        ['3', 'Budi Santoso', '75', '70', '72', '72'],
      ];
    } else if (title.includes('Jurnal')) {
      return [
        ['Tanggal', 'Jam', 'Materi', 'Kegiatan'],
        ['01/12/2024', '07:00-08:30', 'Matematika Dasar', 'Penjelasan Konsep'],
        ['02/12/2024', '07:00-08:30', 'Aljabar Linear', 'Latihan Soal'],
        ['03/12/2024', '07:00-08:30', 'Geometri', 'Diskusi Kelompok'],
      ];
    }
    return [['Data', 'Preview'], ['Sample', 'Data']];
  };

  const tableData = getSampleData();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div 
            className={`${previewWidth} ${previewHeight} bg-white border border-gray-300 shadow-lg text-xs overflow-hidden relative`}
            style={{ fontSize: '8px' }}
          >
            {/* Header Section */}
            <div 
              className="p-2 bg-white border-b border-gray-200 text-center text-black"
            >
              <div className="flex items-center justify-between">
                {format.showLogo && schoolInfo.logo && (
                  <img 
                    src={schoolInfo.logo} 
                    alt="Logo" 
                    className="h-6 w-6 object-contain"
                  />
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm">{schoolInfo.name}</div>
                  <div className="text-xs text-gray-600">{title.toUpperCase()}</div>
                </div>
                {format.showLogo && !schoolInfo.logo && (
                  <div className="h-6 w-6 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-600">LOGO</span>
                  </div>
                )}
              </div>
              
              {schoolInfo.address && (
                <div className="text-xs text-gray-600 mt-1">{schoolInfo.address}</div>
              )}
              
              {format.showDate && (
                <div className="text-xs text-gray-600 mt-1">
                  Tanggal: {new Date().toLocaleDateString('id-ID')}
                </div>
              )}
            </div>

            {/* Teacher Info Section (for relevant reports) */}
            {(title.includes('Jurnal') || title.includes('Penilaian')) && defaultTeacher.name && (
              <div className="p-2 bg-gray-50 border-b">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>Guru: {defaultTeacher.name}</div>
                  <div>NIP: {defaultTeacher.nip}</div>
                  <div className="col-span-2">Mata Pelajaran: {defaultTeacher.subject}</div>
                </div>
              </div>
            )}

            {/* Table Section */}
            <div className="p-2 flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: format.headerColor + '20' }}>
                    {tableData[0]?.map((header, index) => (
                      <th 
                        key={index} 
                        className="border border-gray-300 p-1 text-xs font-semibold text-left"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className="border border-gray-300 p-1 text-xs"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-50 border-t">
              <div className="flex justify-between items-center text-xs">
                <div>Sistem Informasi Sekolah</div>
                <div>Halaman 1</div>
              </div>
              
              {format.showSignature && (
                <div className="mt-2 text-right">
                  <div className="text-xs">Mengetahui,</div>
                  <div className="text-xs">{defaultTeacher?.jabatan_sekolah || 'Kepala Sekolah'}</div>
                  <div className="mt-4 text-xs">({defaultTeacher?.name || '_________________'})</div>
                  {defaultTeacher?.nip && (
                    <div className="text-xs">NIP: {defaultTeacher.nip}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Preview akan berubah sesuai pengaturan format yang dipilih
        </div>
      </CardContent>
    </Card>
  );
};