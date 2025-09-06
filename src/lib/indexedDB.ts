// IndexedDB wrapper with same interface as localStorage version
import { v4 as uuidv4 } from 'uuid';

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface User extends BaseRecord {
  user_id: string;
  nama: string;
  email: string;
  role: 'admin' | 'guru';
  status: string;
  avatar_url?: string;
}

export interface Guru extends BaseRecord {
  nama_guru: string;
  nip: string;
  mata_pelajaran: string;
  email: string;
  telepon?: string;
  jabatan?: string;
  kepala_sekolah_nama?: string;
  kepala_sekolah_nip?: string;
}

export interface MataPelajaran extends BaseRecord {
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  deskripsi?: string;
  status: string;
}

export interface Kelas extends BaseRecord {
  nama_kelas: string;
  tingkat: string;
  jurusan?: string;
  wali_kelas_id?: string;
  tahun_ajaran: string;
  kapasitas: number;
  status: string;
}

export interface Siswa extends BaseRecord {
  nis: string;
  nama_siswa: string;
  kelas_id?: string;
  jenis_kelamin?: 'Laki-laki' | 'Perempuan';
  tanggal_lahir?: string;
  tempat_lahir?: string;
  alamat?: string;
  nama_orang_tua?: string;
  telepon_orang_tua?: string;
  email?: string;
  status: string;
}

export interface JenisKegiatan extends BaseRecord {
  nama_kegiatan: string;
  deskripsi?: string;
}

export interface Jurnal extends BaseRecord {
  tanggal: string;
  jenis_kegiatan_id: string;
  guru_id?: string;
  volume?: number;
  uraian_kegiatan?: string;
  satuan_hasil?: string;
}

export interface Kehadiran extends BaseRecord {
  siswa_id: string;
  kelas_id: string;
  tanggal: string;
  mata_pelajaran_id?: string;
  status_kehadiran: string;
  keterangan?: string;
}

export type TableName = 'users' | 'guru' | 'mata_pelajaran' | 'kelas' | 'siswa' | 'jenis_kegiatan' | 'jurnal' | 'kehadiran';

// Generate UUID function
function generateId(): string {
  return uuidv4();
}

// Get current timestamp
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

class IndexedDBManager {
  private dbName = 'SekolahDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each table
        const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran'];
        
        tables.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            const store = db.createObjectStore(tableName, { keyPath: 'id' });
            // Create indexes for common search fields
            store.createIndex('created_at', 'created_at', { unique: false });
          }
        });
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Initialize default data
  async initializeDefaultData(): Promise<void> {
    await this.ensureDB();
    
    // Add default jenis kegiatan if empty
    const jenisKegiatan = await this.select('jenis_kegiatan');
    if (jenisKegiatan.length === 0) {
      const defaultKegiatan = [
        { nama_kegiatan: 'Mengajar', deskripsi: 'Kegiatan pembelajaran di kelas' },
        { nama_kegiatan: 'Piket', deskripsi: 'Tugas piket sekolah' },
        { nama_kegiatan: 'Pembinaan', deskripsi: 'Kegiatan pembinaan siswa' },
        { nama_kegiatan: 'Rapat', deskripsi: 'Rapat koordinasi' },
        { nama_kegiatan: 'Administrasi', deskripsi: 'Tugas administrasi' }
      ];

      for (const kegiatan of defaultKegiatan) {
        await this.insert('jenis_kegiatan', kegiatan);
      }
    }
  }

  // Select all records from table
  async select(tableName: TableName, filter?: (record: any) => boolean): Promise<any[]> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.getAll();

        request.onsuccess = () => {
          const records = request.result || [];
          resolve(filter ? records.filter(filter) : records);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error reading from ${tableName}:`, error);
      return [];
    }
  }

  // Select single record by ID
  async selectById(tableName: TableName, id: string): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Error reading record from ${tableName}:`, error);
      return null;
    }
  }

  // Insert new record
  async insert(tableName: TableName, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    try {
      const db = await this.ensureDB();
      const newRecord = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      };

      return new Promise((resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.add(newRecord);

        request.onsuccess = () => {
          resolve({ data: newRecord, error: null });
        };

        request.onerror = () => {
          resolve({ data: null, error: `Failed to insert record: ${request.error}` });
        };
      });
    } catch (error) {
      return { data: null, error: `Failed to insert record: ${error}` };
    }
  }

  // Update record by ID
  async update(tableName: TableName, id: string, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    try {
      const db = await this.ensureDB();
      const existingRecord = await this.selectById(tableName, id);
      
      if (!existingRecord) {
        return { data: null, error: 'Record not found' };
      }

      const updatedRecord = {
        ...existingRecord,
        ...data,
        updated_at: getCurrentTimestamp()
      };

      return new Promise((resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.put(updatedRecord);

        request.onsuccess = () => {
          resolve({ data: updatedRecord, error: null });
        };

        request.onerror = () => {
          resolve({ data: null, error: `Failed to update record: ${request.error}` });
        };
      });
    } catch (error) {
      return { data: null, error: `Failed to update record: ${error}` };
    }
  }

  // Delete record by ID
  async delete(tableName: TableName, id: string): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve({ error: null });
        };

        request.onerror = () => {
          resolve({ error: `Failed to delete record: ${request.error}` });
        };
      });
    } catch (error) {
      return { error: `Failed to delete record: ${error}` };
    }
  }

  // Count records
  async count(tableName: TableName, filter?: (record: any) => boolean): Promise<number> {
    const records = await this.select(tableName, filter);
    return records.length;
  }

  // Clear all data from table
  async clear(tableName: TableName): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve({ error: null });
        };

        request.onerror = () => {
          resolve({ error: `Failed to clear table: ${request.error}` });
        };
      });
    } catch (error) {
      return { error: `Failed to clear table: ${error}` };
    }
  }

  // Export all data
  async exportAll(): Promise<Record<TableName, any[]>> {
    const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran'];
    const exportData: Record<TableName, any[]> = {} as Record<TableName, any[]>;
    
    for (const table of tables) {
      exportData[table] = await this.select(table);
    }

    return exportData;
  }

  // Import all data
  async importAll(data: Record<TableName, any[]>): Promise<{ error: null } | { error: string }> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction(Object.keys(data) as TableName[], 'readwrite');
        let pendingOperations = 0;
        let hasError = false;

        Object.entries(data).forEach(([tableName, records]) => {
          const store = transaction.objectStore(tableName as TableName);
          
          records.forEach(record => {
            pendingOperations++;
            const request = store.put(record);
            
            request.onsuccess = () => {
              pendingOperations--;
              if (pendingOperations === 0 && !hasError) {
                resolve({ error: null });
              }
            };
            
            request.onerror = () => {
              hasError = true;
              resolve({ error: `Failed to import data: ${request.error}` });
            };
          });
        });

        if (pendingOperations === 0) {
          resolve({ error: null });
        }
      });
    } catch (error) {
      return { error: `Failed to import data: ${error}` };
    }
  }
}

// Create single instance
export const indexedDB = new IndexedDBManager();