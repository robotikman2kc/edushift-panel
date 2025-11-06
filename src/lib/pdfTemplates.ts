export interface PDFTemplate {
  id: string;
  name: string;
  header?: {
    logo?: string;
    schoolName: string;
    address?: string;
  };
  reportTitle?: string; // Judul laporan yang ditampilkan di bawah garis
  footer?: {
    text?: string;
    showPageNumbers?: boolean;
    signatureSection?: boolean;
  };
  styling: {
    primaryColor: [number, number, number]; // RGB
    secondaryColor: [number, number, number]; // RGB
    fontFamily: 'helvetica' | 'times' | 'courier';
    fontSize: {
      title: number;
      subtitle: number;
      header: number;
      body: number;
    };
  };
  layout: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'a4' | 'a3' | 'letter';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  watermark?: {
    text: string;
    opacity: number;
  };
  teacherInfo?: {
    name: string;
    nip: string;
    subject: string;
    jabatan: string;
    satuan_kerja?: string;
    kepala_sekolah_nama?: string;
    kepala_sekolah_nip?: string;
  };
  signatureLocation?: string;
  tableSettings?: {
    rowHeight: number;
  };
}

export const defaultTemplate: PDFTemplate = {
  id: 'default',
  name: 'Template Default',
  header: {
    schoolName: 'Sistem Informasi Sekolah',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
  },
  reportTitle: 'LAPORAN DATA',
  footer: {
    showPageNumbers: true,
    signatureSection: false,
  },
  styling: {
    primaryColor: [59, 130, 246], // Blue
    secondaryColor: [248, 250, 252], // Light gray
    fontFamily: 'helvetica',
    fontSize: {
      title: 16,
      subtitle: 12,
      header: 10,
      body: 8,
    },
  },
  layout: {
    orientation: 'portrait',
    pageSize: 'a4',
    margins: {
      top: 35,
      right: 14,
      bottom: 20,
      left: 14,
    },
  },
};

export const attendanceTemplate: PDFTemplate = {
  ...defaultTemplate,
  id: 'attendance',
  name: 'Template Rekap Kehadiran',
  header: {
    schoolName: 'Sistem Informasi Akademik',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
  },
  reportTitle: 'REKAP KEHADIRAN SISWA',
  footer: {
    text: 'Dokumen ini digenerate secara otomatis oleh sistem',
    showPageNumbers: true,
    signatureSection: true,
  },
  styling: {
    ...defaultTemplate.styling,
    primaryColor: [34, 197, 94], // Green for attendance
  },
};

export const gradeTemplate: PDFTemplate = {
  ...defaultTemplate,
  id: 'grade',
  name: 'Template Nilai',
  header: {
    schoolName: 'Sistem Informasi Akademik',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
  },
  reportTitle: 'LAPORAN NILAI SISWA',
  footer: {
    text: 'Laporan ini telah disahkan oleh sistem',
    showPageNumbers: true,
    signatureSection: true,
  },
  styling: {
    ...defaultTemplate.styling,
    primaryColor: [168, 85, 247], // Purple for grades
  },
};

export const studentDataTemplate: PDFTemplate = {
  ...defaultTemplate,
  id: 'student',
  name: 'Template Data Siswa',
  header: {
    schoolName: 'Sistem Informasi Akademik',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
  },
  reportTitle: 'DATA SISWA',
  styling: {
    ...defaultTemplate.styling,
    primaryColor: [239, 68, 68], // Red for student data
  },
};

export const teacherDataTemplate: PDFTemplate = {
  ...defaultTemplate,
  id: 'teacher',
  name: 'Template Data Guru',
  header: {
    schoolName: 'Sistem Informasi Akademik',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
  },
  reportTitle: 'DATA GURU',
  styling: {
    ...defaultTemplate.styling,
    primaryColor: [245, 158, 11], // Orange for teacher data
  },
};

export const availableTemplates: PDFTemplate[] = [
  defaultTemplate,
  attendanceTemplate,
  gradeTemplate,
  studentDataTemplate,
  teacherDataTemplate,
];

export const getTemplateById = (id: string): PDFTemplate => {
  return availableTemplates.find(template => template.id === id) || defaultTemplate;
};