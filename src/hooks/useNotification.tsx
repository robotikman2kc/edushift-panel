import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface NotificationSettings {
  enabled: boolean;
  days: string[]; // ['monday', 'tuesday', etc]
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  journalReminder: boolean;
  scheduleReminder: boolean;
  reminderBeforeMinutes: number; // minutes before class
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '07:00',
  endTime: '16:00',
  journalReminder: true,
  scheduleReminder: true,
  reminderBeforeMinutes: 15,
};

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check current permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Tidak Didukung",
        description: "Browser Anda tidak mendukung notifikasi",
        variant: "destructive",
      });
      return false;
    }

    // Get fresh permission status from browser
    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Check if permission was already granted
    if (currentPermission === 'granted') {
      toast({
        title: "Izin Sudah Diberikan",
        description: "Notifikasi sudah aktif",
      });
      return true;
    }

    // Check if permission was denied - inform user how to reset
    if (currentPermission === 'denied') {
      toast({
        title: "Izin Telah Ditolak",
        description: "Untuk mengaktifkan kembali, klik ikon kunci/gembok di sebelah URL lalu ubah pengaturan notifikasi menjadi 'Izinkan', kemudian muat ulang halaman.",
        variant: "destructive",
        duration: 10000,
      });
      return false;
    }

    // Request permission (only works if permission is 'default')
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: "Izin Diberikan",
          description: "Notifikasi telah diaktifkan",
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: "Izin Ditolak",
          description: "Untuk mengaktifkan kembali, klik ikon kunci/gembok di sebelah URL lalu ubah pengaturan notifikasi, kemudian muat ulang halaman.",
          variant: "destructive",
          duration: 10000,
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Gagal Meminta Izin",
        description: "Terjadi kesalahan saat meminta izin notifikasi",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!settings.enabled) {
      console.log('Notifications are disabled in settings');
      return;
    }

    // Check if current day is enabled
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[new Date().getDay()];
    if (!settings.days.includes(currentDay)) {
      console.log('Notifications disabled for today');
      return;
    }

    // Check if current time is within allowed range
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < settings.startTime || currentTime > settings.endTime) {
      console.log('Outside notification time range');
      return;
    }

    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      });
    } else {
      new Notification(title, options);
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));
  };

  const scheduleJournalReminder = () => {
    if (!settings.journalReminder) return;

    sendNotification('Pengingat Jurnal Mengajar', {
      body: 'Jangan lupa mengisi jurnal mengajar hari ini!',
      tag: 'journal-reminder',
      requireInteraction: true,
      data: { url: '/jurnal/agenda-mengajar' },
    });
  };

  const scheduleClassReminder = (className: string, subject: string, time: string) => {
    if (!settings.scheduleReminder) return;

    sendNotification('Pengingat Jadwal Mengajar', {
      body: `${subject} - ${className} dimulai dalam ${settings.reminderBeforeMinutes} menit`,
      tag: 'class-reminder',
      requireInteraction: true,
      data: { url: '/dashboard' },
    });
  };

  return {
    permission,
    settings,
    requestPermission,
    sendNotification,
    updateSettings,
    scheduleJournalReminder,
    scheduleClassReminder,
  };
};
