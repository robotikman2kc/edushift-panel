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
  
  // Keys that are no longer used (moved to IndexedDB)
  const deprecatedKeys = [
    'localdb_ekstrakurikuler',
    'localdb_anggota_eskul',
    'localdb_kehadiran_eskul',
    'localdb_nilai_eskul',
  ];

  // Keys that might be old/unused
  const potentiallyOldKeys = [
    'localdb_backup', // Old backup format
    'migrationCompleted', // Migration flag
    'needsMigration', // Migration flag
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key) || '';
    const size = new Blob([value]).size;

    let shouldRemove = false;
    let reason = '';

    // Check if it's a deprecated key
    if (deprecatedKeys.includes(key)) {
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
    // Deprecated keys (moved to IndexedDB)
    'localdb_ekstrakurikuler': 'Data ekstrakurikuler (sudah di IndexedDB)',
    'localdb_anggota_eskul': 'Data anggota eskul (sudah di IndexedDB)',
    'localdb_kehadiran_eskul': 'Data kehadiran eskul (sudah di IndexedDB)',
    'localdb_nilai_eskul': 'Data nilai eskul (sudah di IndexedDB)',
    
    // Old/migration related
    'localdb_backup': 'Backup lama',
    'migrationCompleted': 'Flag migrasi selesai',
    'needsMigration': 'Flag perlu migrasi',
    
    // Active data (should keep)
    'localdb_users': 'Data pengguna',
    'localdb_guru': 'Data guru',
    'localdb_mata_pelajaran': 'Data mata pelajaran',
    'localdb_kelas': 'Data kelas',
    'localdb_siswa': 'Data siswa',
    'localdb_jenis_kegiatan': 'Jenis kegiatan jurnal',
    'localdb_jurnal': 'Jurnal guru',
    'localdb_kehadiran': 'Kehadiran siswa',
    'localdb_jadwal_pelajaran': 'Jadwal pelajaran',
    'localdb_jam_pelajaran': 'Jam pelajaran',
    'localdb_pengaturan': 'Pengaturan aplikasi',
    'localdb_tahun_ajaran': 'Tahun ajaran',
    'pdfFormatSettings': 'Pengaturan format PDF',
    'theme': 'Tema aplikasi',
    'userProfile': 'Profil user aktif',
    'quickMenuItems': 'Menu cepat',
    'notificationSettings': 'Pengaturan notifikasi',
  };

  return descriptions[key] || 'Data tidak dikenal';
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
