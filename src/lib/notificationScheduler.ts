import { indexedDB } from './indexedDB';
import { format, addMinutes, isAfter, isBefore, parseISO } from 'date-fns';

export interface NotificationSettings {
  enabled: boolean;
  days: string[];
  startTime: string;
  endTime: string;
  journalReminder: boolean;
  scheduleReminder: boolean;
  reminderBeforeMinutes: number;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export class NotificationScheduler {
  private settings: NotificationSettings;
  private checkInterval: number | null = null;
  private journalReminderSent = false;

  constructor() {
    this.settings = this.loadSettings();
    this.init();
  }

  private loadSettings(): NotificationSettings {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      enabled: true,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '07:00',
      endTime: '16:00',
      journalReminder: true,
      scheduleReminder: true,
      reminderBeforeMinutes: 15,
    };
  }

  private init() {
    // Check every minute
    this.checkInterval = window.setInterval(() => {
      this.checkNotifications();
    }, 60000); // 60 seconds

    // Initial check
    this.checkNotifications();
  }

  private async checkNotifications() {
    if (!this.settings.enabled) return;

    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if today is enabled
    if (!this.settings.days.includes(currentDay)) return;

    // Check if within time range
    if (currentTime < this.settings.startTime || currentTime > this.settings.endTime) return;

    // Check journal reminder (once per day at 14:00)
    if (this.settings.journalReminder && currentTime === '14:00' && !this.journalReminderSent) {
      this.sendJournalReminder();
      this.journalReminderSent = true;
    }

    // Reset journal reminder flag at midnight
    if (currentTime === '00:00') {
      this.journalReminderSent = false;
    }

    // Check schedule reminders
    if (this.settings.scheduleReminder) {
      await this.checkScheduleReminders();
    }
  }

  private sendJournalReminder() {
    this.sendNotification('Pengingat Jurnal Mengajar', {
      body: 'Jangan lupa mengisi jurnal mengajar hari ini!',
      tag: 'journal-reminder',
      requireInteraction: true,
      data: { url: '/jurnal/agenda-mengajar' },
    });
  }

  private async checkScheduleReminders() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentDay = DAYS[new Date().getDay()];
      
      // Get today's schedule
      const jadwalList = await indexedDB.select('jadwal_pelajaran', (j) => j.hari === currentDay);
      
      for (const jadwal of jadwalList) {
        // Get jam pelajaran details
        const jamPelajaran = await indexedDB.selectById('jam_pelajaran', jadwal.jam_pelajaran_id);
        if (!jamPelajaran) continue;

        // Parse jam mulai
        const [hours, minutes] = jamPelajaran.jam_mulai.split(':');
        const classTime = new Date();
        classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Calculate reminder time
        const reminderTime = addMinutes(classTime, -this.settings.reminderBeforeMinutes);
        const now = new Date();

        // Check if it's time to send reminder (within 1 minute window)
        const oneMinuteLater = addMinutes(now, 1);
        if (isAfter(reminderTime, now) && isBefore(reminderTime, oneMinuteLater)) {
          // Check if notification already sent today for this schedule
          const notificationKey = `schedule-reminder-${today}-${jadwal.id}`;
          if (localStorage.getItem(notificationKey)) continue;

          // Get kelas and mata pelajaran names
          const kelas = await indexedDB.selectById('kelas', jadwal.kelas_id);
          const mataPelajaran = await indexedDB.selectById('mata_pelajaran', jadwal.mata_pelajaran_id);

          if (kelas && mataPelajaran) {
            this.sendNotification('Pengingat Jadwal Mengajar', {
              body: `${mataPelajaran.nama} - ${kelas.nama} dimulai dalam ${this.settings.reminderBeforeMinutes} menit (${jamPelajaran.jam_mulai})`,
              tag: `class-reminder-${jadwal.id}`,
              requireInteraction: true,
              data: { 
                url: '/dashboard',
                scheduleId: jadwal.id 
              },
            });

            // Mark as sent
            localStorage.setItem(notificationKey, 'sent');
          }
        }
      }

      // Clean up old notification flags (older than today)
      this.cleanupOldNotificationFlags(today);
    } catch (error) {
      console.error('Error checking schedule reminders:', error);
    }
  }

  private cleanupOldNotificationFlags(today: string) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('schedule-reminder-')) {
        const dateMatch = key.match(/schedule-reminder-(\d{4}-\d{2}-\d{2})/);
        if (dateMatch && dateMatch[1] < today) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  private sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      });
    }
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Singleton instance
let schedulerInstance: NotificationScheduler | null = null;

export const initNotificationScheduler = () => {
  if (!schedulerInstance && typeof window !== 'undefined') {
    schedulerInstance = new NotificationScheduler();
  }
  return schedulerInstance;
};

export const getNotificationScheduler = () => schedulerInstance;
