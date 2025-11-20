/**
 * OPFS (Origin Private File System) Storage Manager
 * Digunakan untuk menyimpan file seperti foto profil, logo sekolah, dll.
 * Lebih efisien daripada menyimpan base64 di IndexedDB/localStorage
 */

class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'storage' in navigator && 'getDirectory' in navigator.storage;
  }

  /**
   * Inisialisasi OPFS root directory
   */
  async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('OPFS not supported, falling back to base64 storage');
      return false;
    }

    try {
      this.root = await navigator.storage.getDirectory();
      return true;
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
      return false;
    }
  }

  /**
   * Pastikan OPFS sudah diinisialisasi
   */
  private async ensureInit(): Promise<boolean> {
    if (this.root) return true;
    return await this.init();
  }

  /**
   * Simpan file ke OPFS
   * @param path - Path file (e.g., 'avatars/user-123.jpg')
   * @param blob - Blob atau File yang akan disimpan
   * @returns URL untuk mengakses file (blob URL)
   */
  async saveFile(path: string, blob: Blob): Promise<string | null> {
    if (!(await this.ensureInit())) {
      // Fallback ke base64 jika OPFS tidak tersedia
      return await this.blobToBase64(blob);
    }

    try {
      const pathParts = path.split('/');
      const fileName = pathParts.pop()!;
      
      // Buat direktori jika belum ada
      let currentDir = this.root!;
      for (const dirName of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
      }

      // Simpan file
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      // Return path untuk referensi
      return `opfs://${path}`;
    } catch (error) {
      console.error('Failed to save file to OPFS:', error);
      // Fallback ke base64
      return await this.blobToBase64(blob);
    }
  }

  /**
   * Ambil file dari OPFS
   * @param path - Path file yang disimpan
   * @returns Blob URL yang bisa digunakan di img src
   */
  async getFile(path: string): Promise<string | null> {
    // Jika path adalah base64, return langsung (backward compatibility)
    if (path.startsWith('data:')) {
      return path;
    }

    // Jika path bukan OPFS, return null
    if (!path.startsWith('opfs://')) {
      return null;
    }

    if (!(await this.ensureInit())) {
      return null;
    }

    try {
      const actualPath = path.replace('opfs://', '');
      const pathParts = actualPath.split('/');
      const fileName = pathParts.pop()!;

      // Navigate ke direktori
      let currentDir = this.root!;
      for (const dirName of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(dirName);
      }

      // Ambil file
      const fileHandle = await currentDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      
      // Buat blob URL
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Failed to get file from OPFS:', error);
      return null;
    }
  }

  /**
   * Hapus file dari OPFS
   * @param path - Path file yang akan dihapus
   */
  async deleteFile(path: string): Promise<boolean> {
    if (!path.startsWith('opfs://')) {
      return true; // Tidak perlu hapus jika bukan OPFS
    }

    if (!(await this.ensureInit())) {
      return false;
    }

    try {
      const actualPath = path.replace('opfs://', '');
      const pathParts = actualPath.split('/');
      const fileName = pathParts.pop()!;

      // Navigate ke direktori
      let currentDir = this.root!;
      for (const dirName of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(dirName);
      }

      // Hapus file
      await currentDir.removeEntry(fileName);
      return true;
    } catch (error) {
      console.error('Failed to delete file from OPFS:', error);
      return false;
    }
  }

  /**
   * Convert blob ke base64 (fallback)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Migrate data dari base64 ke OPFS
   * @param base64Data - Data base64 yang akan dimigrate
   * @param targetPath - Path tujuan di OPFS
   */
  async migrateFromBase64(base64Data: string, targetPath: string): Promise<string> {
    if (!base64Data.startsWith('data:')) {
      return base64Data; // Already migrated or not base64
    }

    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();

      // Save to OPFS
      const newPath = await this.saveFile(targetPath, blob);
      return newPath || base64Data; // Fallback to original if failed
    } catch (error) {
      console.error('Failed to migrate from base64:', error);
      return base64Data;
    }
  }

  /**
   * Cek apakah OPFS didukung
   */
  isOPFSSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Hitung total ukuran file di OPFS
   */
  async calculateTotalSize(): Promise<number> {
    if (!(await this.ensureInit())) {
      return 0;
    }

    try {
      let totalSize = 0;
      
      // Recursive function to traverse directories
      const traverseDirectory = async (dirHandle: FileSystemDirectoryHandle): Promise<void> => {
        // @ts-ignore - FileSystemDirectoryHandle has entries() method
        for await (const [, entry] of dirHandle.entries()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            totalSize += file.size;
          } else if (entry.kind === 'directory') {
            await traverseDirectory(entry);
          }
        }
      };

      await traverseDirectory(this.root!);
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate OPFS size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const opfsStorage = new OPFSManager();
