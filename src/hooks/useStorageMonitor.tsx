import { useState, useEffect } from 'react';

interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
}

interface TableSize {
  name: string;
  count: number;
  estimatedSize: number;
  description?: string;
}

interface LocalStorageItem {
  key: string;
  size: number;
  description?: string;
}

interface StorageData {
  total: StorageInfo;
  indexedDB: {
    size: number;
    tables: TableSize[];
  };
  localStorage: {
    size: number;
    items: number;
    details: LocalStorageItem[];
  };
  opfs: {
    size: number;
    supported: boolean;
  };
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

  const calculateStorageUsage = async (): Promise<StorageData> => {
    try {
      // Get total storage estimate
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;

      // Calculate IndexedDB size
      let indexedDBSize = 0;
      const tables: TableSize[] = [];

      try {
        const dbRequest = indexedDB.open('sekolah-db', 1);
        
        await new Promise((resolve, reject) => {
          dbRequest.onsuccess = async () => {
            const db = dbRequest.result;
            const tableNames = Array.from(db.objectStoreNames);
            
            for (const tableName of tableNames) {
              try {
                const transaction = db.transaction(tableName, 'readonly');
                const store = transaction.objectStore(tableName);
                const countRequest = store.count();
                
                const count = await new Promise<number>((res, rej) => {
                  countRequest.onsuccess = () => res(countRequest.result);
                  countRequest.onerror = () => rej(countRequest.error);
                });

                // Estimate size (rough calculation)
                const getAllRequest = store.getAll();
                const allData = await new Promise<any[]>((res, rej) => {
                  getAllRequest.onsuccess = () => res(getAllRequest.result);
                  getAllRequest.onerror = () => rej(getAllRequest.error);
                });

                const estimatedSize = new Blob([JSON.stringify(allData)]).size;
                indexedDBSize += estimatedSize;

                tables.push({
                  name: tableName,
                  count,
                  estimatedSize,
                  description: getTableDescription(tableName)
                });
              } catch (err) {
                console.error(`Error reading table ${tableName}:`, err);
              }
            }
            
            db.close();
            resolve(undefined);
          };
          
          dbRequest.onerror = () => {
            console.warn('IndexedDB not available or empty');
            resolve(undefined);
          };
        });
      } catch (err) {
        console.warn('IndexedDB error:', err);
      }

      // Calculate localStorage size with details
      let localStorageSize = 0;
      let localStorageItems = 0;
      const localStorageDetails: LocalStorageItem[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([key + value]).size;
            localStorageSize += size;
            localStorageItems++;
            
            localStorageDetails.push({
              key,
              size,
              description: getTableDescription(key)
            });
          }
        }
      }

      // Check OPFS support and size (approximate)
      const opfsSupported = 'storage' in navigator && 'getDirectory' in navigator.storage;
      let opfsSize = 0;
      
      // Estimate OPFS size from remaining usage
      if (opfsSupported) {
        opfsSize = Math.max(0, used - indexedDBSize - localStorageSize);
      }

      return {
        total: {
          used,
          quota,
          percentage: quota > 0 ? (used / quota) * 100 : 0
        },
        indexedDB: {
          size: indexedDBSize,
          tables: tables.sort((a, b) => b.estimatedSize - a.estimatedSize)
        },
        localStorage: {
          size: localStorageSize,
          items: localStorageItems,
          details: localStorageDetails.sort((a, b) => b.size - a.size)
        },
        opfs: {
          size: opfsSize,
          supported: opfsSupported
        }
      };
    } catch (err) {
      console.error('Error calculating storage usage:', err);
      throw err;
    }
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
