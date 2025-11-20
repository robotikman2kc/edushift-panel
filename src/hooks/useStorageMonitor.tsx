import { useState, useEffect } from 'react';
import { indexedDB } from '@/lib/indexedDB';
import { dataMigration } from '@/lib/migrationUtils';
import { isWhitelisted, getStorageDescription } from '@/lib/storageConfig';

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface TableSize {
  name: string;
  size: number;
  count: number;
}

export interface LocalStorageItem {
  key: string;
  size: number;
  value?: string;
  description?: string;
  isWhitelisted?: boolean;
}

export interface MigrationStatus {
  needsMigration: boolean;
  pendingTables: { table: string; recordCount: number }[];
  totalRecords: number;
}

export interface StorageData {
  total: StorageInfo;
  indexedDB: {
    size: number;
    tables: TableSize[];
  };
  localStorage: {
    size: number;
    items: LocalStorageItem[];
  };
  opfs: {
    size: number;
    supported: boolean;
  };
  migration?: MigrationStatus;
}

export const useStorageMonitor = () => {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTableDescription = (tableName: string): string => {
    const descriptions: Record<string, string> = {
      // IndexedDB tables
      'nilai': 'Data nilai siswa per mata pelajaran',
      'jenis_penilaian': 'Kategori penilaian (UH, UTS, UAS, dll)',
      'bobot_penilaian': 'Bobot nilai per kelas dan kategori',
      'catatan_kalender': 'Catatan & reminder di kalender',
      'hari_libur': 'Data hari libur nasional',
      // localStorage tables
      'localdb_users': 'Data pengguna aplikasi',
      'localdb_guru': 'Data guru/pengajar',
      'localdb_mata_pelajaran': 'Data mata pelajaran',
      'localdb_kelas': 'Data kelas',
      'localdb_siswa': 'Data siswa',
      'localdb_jenis_kegiatan': 'Jenis kegiatan jurnal guru',
      'localdb_jurnal': 'Jurnal kegiatan harian guru',
      'localdb_kehadiran': 'Data presensi/kehadiran siswa',
      'localdb_jadwal_pelajaran': 'Jadwal pelajaran per kelas',
      'localdb_jam_pelajaran': 'Waktu jam pelajaran',
      'localdb_pengaturan': 'Pengaturan aplikasi',
      'pdfTemplate': 'Template format PDF laporan',
      'currentUser': 'Data user yang sedang login',
      'notificationSettings': 'Pengaturan notifikasi',
      'lastGoogleBackup': 'Info backup terakhir ke Google Drive',
      'googleDriveSettings': 'Pengaturan Google Drive',
    };
    return descriptions[tableName] || '';
  };

  const getMigrationStatus = async (): Promise<MigrationStatus | undefined> => {
    try {
      // Check if migration is already completed
      const migrationCompleted = localStorage.getItem('migrationCompleted');
      if (migrationCompleted) {
        return undefined;
      }

      // Check session storage first (from main.tsx)
      const sessionData = sessionStorage.getItem('migrationData');
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // Otherwise check directly
      return await dataMigration.getMigrationStatus();
    } catch (error) {
      console.error('Error getting migration status:', error);
      return undefined;
    }
  };

  const calculateStorageUsage = async (): Promise<StorageData> => {
    const estimate = await navigator.storage.estimate();
    const totalUsed = estimate.usage || 0;

    // Calculate IndexedDB size
    let indexedDBSize = 0;
    const tableSizes: TableSize[] = [];
    
    try {
      const tables = await indexedDB.exportAll();
      
      for (const [tableName, records] of Object.entries(tables)) {
        const size = new Blob([JSON.stringify(records)]).size;
        indexedDBSize += size;
        tableSizes.push({
          name: tableName,
          size,
          count: Array.isArray(records) ? records.length : 0,
        });
      }
    } catch (error) {
      console.error('Error calculating IndexedDB size:', error);
    }

    // Calculate localStorage size
    let localStorageSize = 0;
    const items: LocalStorageItem[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const size = new Blob([value]).size;
          items.push({
            key,
            size,
            description: getStorageDescription(key),
            isWhitelisted: isWhitelisted(key),
          });
          localStorageSize += size;
        }
      }
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
    }

    // Calculate OPFS size
    let opfsSize = 0;
    let opfsSupported = false;
    
    try {
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        opfsSupported = true;
        // Import opfsStorage dynamically to calculate size
        const { opfsStorage } = await import('@/lib/opfsStorage');
        opfsSize = await opfsStorage.calculateTotalSize();
      }
    } catch (error) {
      console.warn('OPFS calculation error:', error);
    }

    // Get migration status
    const migrationStatus = await getMigrationStatus();

    return {
      total: {
        total: estimate.quota || 0,
        used: totalUsed,
        available: (estimate.quota || 0) - totalUsed,
        percentage: estimate.quota ? (totalUsed / estimate.quota) * 100 : 0,
      },
      indexedDB: {
        size: indexedDBSize,
        tables: tableSizes,
      },
      localStorage: {
        size: localStorageSize,
        items,
      },
      opfs: {
        size: opfsSize,
        supported: opfsSupported,
      },
      migration: migrationStatus,
    };
  };

  const refreshStorageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await calculateStorageUsage();
      setStorageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate storage usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStorageData();
  }, []);

  return {
    storageData,
    loading,
    error,
    refresh: refreshStorageData
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
