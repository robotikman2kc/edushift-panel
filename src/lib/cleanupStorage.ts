// Utility to cleanup old localStorage data that's no longer used

export interface CleanupItem {
  key: string;
  description: string;
  size: number;
  shouldRemove: boolean;
  reason?: string;
}

export function analyzeLocalStorage(): CleanupItem[] {
  const items: CleanupItem[] = [];
  
  // Keys that are actively used and should NOT be removed
  const activeKeys = [
    'pdfFormatSettings',
    'theme',
    'userProfile',
    'quickMenuItems',
    'notificationSettings',
    'lastBackupDate',
    'selectedDate',
    'authSession',
    'auth_users',
    'auth_session', 
    'auth_currentUser',
    'sidebarState',
    'userPreferences',
    'developer_notes',
    'custom_jurnal_templates',
    'eskulRekapFilters',
    'agenda_mengajar_from_kehadiran',
  ];
  
  // Keys that are no longer used (ALL moved to IndexedDB)
  const deprecatedKeys = [
    'localdb_ekstrakurikuler',
    'localdb_anggota_eskul',
    'localdb_kehadiran_eskul',
    'localdb_nilai_eskul',
    'localdb_users',
    'localdb_guru',
    'localdb_mata_pelajaran',
    'localdb_kelas',
    'localdb_siswa',
    'localdb_jenis_kegiatan',
    'localdb_jurnal',
    'localdb_kehadiran',
    'localdb_jadwal_pelajaran',
    'localdb_jam_pelajaran',
    'localdb_pengaturan',
    'localdb_tahun_ajaran',
    'localdb_nilai',
    'localdb_kategori_nilai',
    'localdb_agenda_mengajar',
    'localdb_catatan_kalender',
    'localdb_hari_libur',
    'localdb_activity_log',
  ];

  // Keys that might be old/unused
  const potentiallyOldKeys = [
    'localdb_backup', // Old backup format
    'migrationCompleted', // Migration flag
    'needsMigration', // Migration flag
    'eskulMigrationCompleted', // Eskul migration flag
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key) || '';
    const size = new Blob([value]).size;

    let shouldRemove = false;
    let reason = '';

    // Check if it's actively used - should NOT remove
    if (activeKeys.includes(key)) {
      shouldRemove = false;
      reason = 'Data aktif digunakan';
    }
    // Check for filter keys (active)
    else if (key.startsWith('input_kehadiran_') || 
             key.startsWith('rekap_kehadiran_') || 
             key.startsWith('laporan_kehadiran_') ||
             key.startsWith('rekap_nilai_') ||
             key.startsWith('table_sort_') ||
             key.startsWith('ally-supports-cache')) {
      shouldRemove = false;
      reason = 'Data filter/state aktif digunakan';
    }
    // Check if it's a deprecated key
    else if (deprecatedKeys.includes(key)) {
      shouldRemove = true;
      reason = 'Data sudah dipindahkan ke IndexedDB';
    }
    // Check if it's potentially old
    else if (potentiallyOldKeys.includes(key)) {
      shouldRemove = true;
      reason = 'Data lama yang sudah tidak digunakan';
    }
    // Check for empty data
    else if (value === '[]' || value === '{}' || value === '') {
      shouldRemove = true;
      reason = 'Data kosong';
    }
    // Unknown keys - suggest removal with warning
    else {
      shouldRemove = true;
      reason = 'Data tidak dikenal (periksa dulu sebelum hapus)';
    }

    items.push({
      key,
      description: getKeyDescription(key),
      size,
      shouldRemove,
      reason,
    });
  }

  return items.sort((a, b) => {
    // Sort by shouldRemove first, then by size
    if (a.shouldRemove !== b.shouldRemove) {
      return a.shouldRemove ? -1 : 1;
    }
    return b.size - a.size;
  });
}

function getKeyDescription(key: string): string {
  const descriptions: Record<string, string> = {
    // ALL deprecated keys (moved to IndexedDB)
    'localdb_ekstrakurikuler': 'Data ekstrakurikuler (sudah di IndexedDB)',
    'localdb_anggota_eskul': 'Data anggota eskul (sudah di IndexedDB)',
    'localdb_kehadiran_eskul': 'Data kehadiran eskul (sudah di IndexedDB)',
    'localdb_nilai_eskul': 'Data nilai eskul (sudah di IndexedDB)',
    'localdb_users': 'Data pengguna (sudah di IndexedDB)',
    'localdb_guru': 'Data guru (sudah di IndexedDB)',
    'localdb_mata_pelajaran': 'Data mata pelajaran (sudah di IndexedDB)',
    'localdb_kelas': 'Data kelas (sudah di IndexedDB)',
    'localdb_siswa': 'Data siswa (sudah di IndexedDB)',
    'localdb_jenis_kegiatan': 'Jenis kegiatan jurnal (sudah di IndexedDB)',
    'localdb_jurnal': 'Jurnal guru (sudah di IndexedDB)',
    'localdb_kehadiran': 'Kehadiran siswa (sudah di IndexedDB)',
    'localdb_jadwal_pelajaran': 'Jadwal pelajaran (sudah di IndexedDB)',
    'localdb_jam_pelajaran': 'Jam pelajaran (sudah di IndexedDB)',
    'localdb_pengaturan': 'Pengaturan aplikasi (sudah di IndexedDB)',
    'localdb_tahun_ajaran': 'Tahun ajaran (sudah di IndexedDB)',
    'localdb_nilai': 'Data nilai siswa (sudah di IndexedDB)',
    'localdb_kategori_nilai': 'Kategori penilaian (sudah di IndexedDB)',
    'localdb_agenda_mengajar': 'Agenda mengajar (sudah di IndexedDB)',
    'localdb_catatan_kalender': 'Catatan kalender (sudah di IndexedDB)',
    'localdb_hari_libur': 'Hari libur (sudah di IndexedDB)',
    'localdb_activity_log': 'Log aktivitas (sudah di IndexedDB)',
    
    // Old/migration related
    'localdb_backup': 'Backup lama (tidak terpakai)',
    'migrationCompleted': 'Flag migrasi (tidak terpakai)',
    'needsMigration': 'Flag migrasi (tidak terpakai)',
    'eskulMigrationCompleted': 'Flag migrasi eskul (tidak terpakai)',
    
    // Active data (should keep)
    'pdfFormatSettings': 'Pengaturan format PDF (AKTIF)',
    'theme': 'Tema aplikasi (AKTIF)',
    'userProfile': 'Profil user (AKTIF)',
    'quickMenuItems': 'Menu cepat (AKTIF)',
    'notificationSettings': 'Pengaturan notifikasi (AKTIF)',
    'lastBackupDate': 'Tanggal backup terakhir (AKTIF)',
    'selectedDate': 'Tanggal terpilih (AKTIF)',
    'authSession': 'Sesi autentikasi (AKTIF)',
    'developer_notes': 'Catatan developer (AKTIF)',
    'custom_jurnal_templates': 'Template jurnal custom (AKTIF)',
    'eskulRekapFilters': 'Filter rekap eskul (AKTIF)',
    'agenda_mengajar_from_kehadiran': 'Filter agenda dari kehadiran (AKTIF)',
  };

  // Check for pattern-based keys (active)
  if (key.startsWith('input_kehadiran_')) {
    return 'Filter input kehadiran (AKTIF)';
  }
  if (key.startsWith('rekap_kehadiran_')) {
    return 'Filter rekap kehadiran (AKTIF)';
  }
  if (key.startsWith('laporan_kehadiran_')) {
    return 'Filter laporan kehadiran (AKTIF)';
  }
  if (key.startsWith('rekap_nilai_')) {
    return 'Filter rekap nilai (AKTIF)';
  }
  if (key.startsWith('table_sort_')) {
    return 'Pengaturan sorting tabel (AKTIF)';
  }
  if (key.startsWith('ally-supports-cache')) {
    return 'Cache aksesibilitas (sistem)';
  }
  
  return descriptions[key] || 'Data tidak dikenal (periksa sebelum hapus)';
}

export function cleanupOldData(keysToRemove: string[]): number {
  let removedCount = 0;
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`Removed: ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  });

  return removedCount;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
