import { indexedDB } from './indexedDB';

interface BackupSettings {
  webhookUrl: string;
  intervalDays: number;
  lastBackupDate: Date | null;
  autoBackupEnabled: boolean;
}

interface BackupResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

class GoogleDriveBackup {
  private readonly SETTINGS_KEY = 'google_drive_backup_settings';
  private readonly LAST_BACKUP_KEY = 'google_drive_last_backup';

  /**
   * Get backup settings from localStorage
   */
  async getSettings(): Promise<BackupSettings> {
    try {
      const settings = await indexedDB.select('pengaturan');
      const webhookSetting = settings.find((s: any) => s.key === this.SETTINGS_KEY);
      const lastBackupSetting = settings.find((s: any) => s.key === this.LAST_BACKUP_KEY);

      let parsedSettings: any = {};
      if (webhookSetting && webhookSetting.value) {
        parsedSettings = typeof webhookSetting.value === 'string' 
          ? JSON.parse(webhookSetting.value)
          : webhookSetting.value;
      }

      return {
        webhookUrl: parsedSettings.webhookUrl || '',
        intervalDays: parsedSettings.intervalDays || 7,
        autoBackupEnabled: parsedSettings.autoBackupEnabled ?? true, // Default true
        lastBackupDate: lastBackupSetting?.value ? new Date(lastBackupSetting.value) : null,
      };
    } catch (error) {
      console.error('Error getting backup settings:', error);
      return {
        webhookUrl: '',
        intervalDays: 7,
        autoBackupEnabled: true,
        lastBackupDate: null,
      };
    }
  }

  /**
   * Save backup settings to localStorage
   */
  async saveSettings(settings: { webhookUrl: string; intervalDays: number; autoBackupEnabled?: boolean }): Promise<void> {
    try {
      const allSettings = await indexedDB.select('pengaturan');
      const existing = allSettings.find((s: any) => s.key === this.SETTINGS_KEY);

      const value = JSON.stringify({
        webhookUrl: settings.webhookUrl,
        intervalDays: settings.intervalDays,
        autoBackupEnabled: settings.autoBackupEnabled ?? true, // Default true if not specified
      });

      if (existing) {
        await indexedDB.update('pengaturan', existing.id, { value });
      } else {
        await indexedDB.insert('pengaturan', {
          key: this.SETTINGS_KEY,
          value,
        });
      }
    } catch (error) {
      console.error('Error saving backup settings:', error);
      throw error;
    }
  }

  /**
   * Test webhook connection
   */
  async testConnection(webhookUrl: string): Promise<BackupResult> {
    try {
      const testData = {
        fileName: 'test_connection.json',
        content: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const result = JSON.parse(text);
      
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Test connection failed:', error);
      return {
        success: false,
        error: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * Export all data from IndexedDB
   */
  async exportAllData(): Promise<any> {
    try {
      const tables = ['siswa', 'kelas', 'guru', 'mata_pelajaran', 'nilai', 'kehadiran', 'jurnal', 'jenis_kegiatan', 'kategori_penilaian', 'bobot_penilaian'];
      const exportData: any = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {},
      };

      for (const table of tables) {
        try {
          const data = await indexedDB.select(table as any);
          exportData.data[table] = data;
        } catch (error) {
          console.warn(`Failed to export table ${table}:`, error);
          exportData.data[table] = [];
        }
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Perform backup to Google Drive
   */
  async performBackup(): Promise<BackupResult> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      // Check internet connection
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Export all data
      const exportData = await this.exportAllData();
      
      // Generate filename
      const now = new Date();
      const fileName = `backup_${now.toISOString().split('T')[0]}_${now.getHours()}${now.getMinutes()}.json`;

      // Send to webhook
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          fileName,
          content: exportData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const result = JSON.parse(text);

      if (result.success) {
        // Update last backup date
        await this.updateLastBackupDate(new Date());
        
        return {
          success: true,
          fileName: result.fileName || fileName,
        };
      } else {
        throw new Error(result.error || 'Backup failed');
      }
    } catch (error: any) {
      console.error('Backup failed:', error);
      return {
        success: false,
        error: error.message || 'Backup process failed',
      };
    }
  }

  /**
   * Update last backup date
   */
  private async updateLastBackupDate(date: Date): Promise<void> {
    try {
      const dateString = date.toISOString();
      
      // Update IndexedDB
      const allSettings = await indexedDB.select('pengaturan');
      const existing = allSettings.find((s: any) => s.key === this.LAST_BACKUP_KEY);

      if (existing) {
        await indexedDB.update('pengaturan', existing.id, {
          value: dateString,
        });
      } else {
        await indexedDB.insert('pengaturan', {
          key: this.LAST_BACKUP_KEY,
          value: dateString,
        });
      }
      
      // Also update localStorage so TopBar warning can detect it
      localStorage.setItem('lastBackupDate', dateString);
    } catch (error) {
      console.error('Error updating last backup date:', error);
    }
  }

  /**
   * Check if backup is needed based on interval
   */
  async shouldBackup(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      
      // Don't auto backup if feature is disabled
      if (!settings.autoBackupEnabled) {
        return false;
      }
      
      // Don't auto backup if webhook URL is not configured
      if (!settings.webhookUrl) {
        return false;
      }

      // Don't auto backup if no previous backup (user must manually trigger first backup)
      if (!settings.lastBackupDate) {
        return false; // Changed from true to false - require manual first backup
      }

      const now = new Date();
      const lastBackup = new Date(settings.lastBackupDate);
      const daysSinceBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

      return daysSinceBackup >= settings.intervalDays;
    } catch (error) {
      console.error('Error checking backup status:', error);
      return false;
    }
  }

  /**
   * Auto backup if needed (called on app start or periodically)
   */
  async autoBackup(): Promise<void> {
    try {
      // Check internet connection
      if (!navigator.onLine) {
        console.log('Auto backup skipped: No internet connection');
        return;
      }

      const shouldBackup = await this.shouldBackup();
      
      if (shouldBackup) {
        console.log('Starting auto backup...');
        const result = await this.performBackup();
        
        if (result.success) {
          console.log('Auto backup completed successfully:', result.fileName);
          
          // Show notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Backup Berhasil', {
              body: `Data berhasil dibackup ke Google Drive`,
              icon: '/icon-192.png',
            });
          }
        } else {
          console.error('Auto backup failed:', result.error);
        }
      } else {
        console.log('Auto backup not needed yet');
      }
    } catch (error) {
      console.error('Auto backup error:', error);
    }
  }
}

export const googleDriveBackup = new GoogleDriveBackup();
