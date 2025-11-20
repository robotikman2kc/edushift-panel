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

  const calculateStorageUsage = async (): Promise<StorageData> => {
    try {
      // Get total storage estimate
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;

      // Calculate IndexedDB size
      let indexedDBSize = 0;
      const tables: TableSize[] = [];

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
                estimatedSize
              });
            } catch (err) {
              console.error(`Error reading table ${tableName}:`, err);
            }
          }
          
          db.close();
          resolve(undefined);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
      });

      // Calculate localStorage size
      let localStorageSize = 0;
      let localStorageItems = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageSize += new Blob([key + value]).size;
            localStorageItems++;
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
          items: localStorageItems
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
