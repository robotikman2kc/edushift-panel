// Configuration for localStorage usage
// Only these keys should remain in localStorage after migration

export const LOCAL_STORAGE_WHITELIST = [
  // Authentication
  'auth_users',
  'auth_session',
  'auth_currentUser',
  
  // Settings
  'pdfFormatSettings',
  'notificationSettings',
  'theme', // next-themes
  
  // Backup & Migration
  'localdb_backup',
  'lastBackupDate',
  'migrationCompleted',
  
  // Other app settings
  'sidebarState',
  'userPreferences',
] as const;

export type WhitelistedKey = typeof LOCAL_STORAGE_WHITELIST[number];

// Check if a localStorage key should be kept
export function isWhitelisted(key: string): boolean {
  return LOCAL_STORAGE_WHITELIST.includes(key as WhitelistedKey) || key.startsWith('ally-supports-cache');
}

// Get localStorage items that should be migrated (not whitelisted)
export function getNonWhitelistedKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !isWhitelisted(key)) {
      keys.push(key);
    }
  }
  return keys;
}

// Get human-readable description for whitelisted items
export function getStorageDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'auth_users': 'Data pengguna & autentikasi',
    'auth_session': 'Sesi login aktif',
    'auth_currentUser': 'Informasi pengguna saat ini',
    'pdfFormatSettings': 'Pengaturan format PDF',
    'notificationSettings': 'Pengaturan notifikasi',
    'theme': 'Tema aplikasi (terang/gelap)',
    'localdb_backup': 'Backup data untuk recovery',
    'lastBackupDate': 'Tanggal backup terakhir',
    'migrationCompleted': 'Status migrasi data',
    'sidebarState': 'Status sidebar (buka/tutup)',
    'userPreferences': 'Preferensi pengguna',
  };
  
  return descriptions[key] || 'Pengaturan aplikasi';
}
