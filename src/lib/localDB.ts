// Local database utility using localStorage for data persistence
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
  telepon?: string;
  alamat?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  bio?: string;
  jenis_kelamin?: 'Laki-laki' | 'Perempuan';
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

export type TableName = 'users' | 'guru' | 'mata_pelajaran' | 'kelas' | 'siswa' | 'jenis_kegiatan' | 'jurnal' | 'kehadiran' | 'jadwal_pelajaran' | 'jam_pelajaran' | 'pengaturan';

// Generate UUID function
function generateId(): string {
  return uuidv4();
}

// Get current timestamp
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

class LocalDB {
  private getStorageKey(tableName: TableName): string {
    return `localdb_${tableName}`;
  }

  // Initialize default data
  initializeDefaultData() {
    const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran', 'jadwal_pelajaran', 'jam_pelajaran', 'pengaturan'];
    
    tables.forEach(table => {
      if (!localStorage.getItem(this.getStorageKey(table))) {
        localStorage.setItem(this.getStorageKey(table), JSON.stringify([]));
      }
    });

    // Add default jenis kegiatan if empty
    const jenisKegiatan = this.select('jenis_kegiatan');
    if (jenisKegiatan.length === 0) {
      const defaultKegiatan = [
        { nama_kegiatan: 'Mengajar', deskripsi: 'Kegiatan pembelajaran di kelas' },
        { nama_kegiatan: 'Piket', deskripsi: 'Tugas piket sekolah' },
        { nama_kegiatan: 'Pembinaan', deskripsi: 'Kegiatan pembinaan siswa' },
        { nama_kegiatan: 'Rapat', deskripsi: 'Rapat koordinasi' },
        { nama_kegiatan: 'Administrasi', deskripsi: 'Tugas administrasi' }
      ];

      defaultKegiatan.forEach(kegiatan => {
        this.insert('jenis_kegiatan', kegiatan);
      });
    }

    // Initialize IndexedDB migration in background
    this.initIndexedDBMigration();
  }

  // Background IndexedDB migration
  private async initIndexedDBMigration() {
    try {
      // Import IndexedDB utilities dynamically to avoid blocking
      const { indexedDB } = await import('./indexedDB');
      const { DataMigration } = await import('./migrationUtils');
      
      await indexedDB.initDB();
      const migration = new DataMigration();
      const needsMigration = await migration.isMigrationNeeded();
      
      if (needsMigration) {
        console.log('Starting background migration to IndexedDB...');
        const result = await migration.migrateData();
        
        if (result.success) {
          console.log('Background migration to IndexedDB completed successfully');
          // Data is now available in both localStorage and IndexedDB
        } else {
          console.warn('IndexedDB migration failed, continuing with localStorage:', result.error);
        }
      }
    } catch (error) {
      console.warn('IndexedDB not available, using localStorage only:', error);
    }
  }

  // Select all records from table
  select(tableName: TableName, filter?: (record: any) => boolean): any[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(tableName));
      const records = data ? JSON.parse(data) : [];
      return filter ? records.filter(filter) : records;
    } catch (error) {
      console.error(`Error reading from ${tableName}:`, error);
      return [];
    }
  }

  // Select single record by ID
  selectById(tableName: TableName, id: string): any | null {
    const records = this.select(tableName);
    return records.find(record => record.id === id) || null;
  }

  // Insert new record
  insert(tableName: TableName, data: Partial<any>): { data: any; error: null } | { data: null; error: string } {
    try {
      const records = this.select(tableName);
      const newRecord = {
        ...data,
        id: generateId(),
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp()
      };

      records.push(newRecord);
      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(records));
      
      return { data: newRecord, error: null };
    } catch (error) {
      return { data: null, error: `Failed to insert record: ${error}` };
    }
  }

  // Update record by ID
  update(tableName: TableName, id: string, data: Partial<any>): { data: any; error: null } | { data: null; error: string } {
    try {
      const records = this.select(tableName);
      const recordIndex = records.findIndex(record => record.id === id);
      
      if (recordIndex === -1) {
        return { data: null, error: 'Record not found' };
      }

      records[recordIndex] = {
        ...records[recordIndex],
        ...data,
        updated_at: getCurrentTimestamp()
      };

      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(records));
      
      return { data: records[recordIndex], error: null };
    } catch (error) {
      return { data: null, error: `Failed to update record: ${error}` };
    }
  }

  // Delete record by ID
  delete(tableName: TableName, id: string): { error: null } | { error: string } {
    try {
      const records = this.select(tableName);
      const filteredRecords = records.filter(record => record.id !== id);
      
      if (records.length === filteredRecords.length) {
        return { error: 'Record not found' };
      }

      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(filteredRecords));
      
      return { error: null };
    } catch (error) {
      return { error: `Failed to delete record: ${error}` };
    }
  }

  // Count records
  count(tableName: TableName, filter?: (record: any) => boolean): number {
    const records = this.select(tableName, filter);
    return records.length;
  }

  // Clear all data from table
  clear(tableName: TableName): { error: null } | { error: string } {
    try {
      localStorage.setItem(this.getStorageKey(tableName), JSON.stringify([]));
      return { error: null };
    } catch (error) {
      return { error: `Failed to clear table: ${error}` };
    }
  }

  // Export all data
  exportAll(): Record<TableName, any[]> {
    const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran', 'jadwal_pelajaran', 'jam_pelajaran', 'pengaturan'];
    const exportData: Record<TableName, any[]> = {} as Record<TableName, any[]>;
    
    tables.forEach(table => {
      exportData[table] = this.select(table);
    });

    return exportData;
  }

  // Import all data
  importAll(data: Record<TableName, any[]>): { error: null } | { error: string } {
    try {
      Object.entries(data).forEach(([tableName, records]) => {
        localStorage.setItem(this.getStorageKey(tableName as TableName), JSON.stringify(records));
      });
      return { error: null };
    } catch (error) {
      return { error: `Failed to import data: ${error}` };
    }
  }
}

// Create single instance
export const localDB = new LocalDB();

// Initialize on module load
localDB.initializeDefaultData();