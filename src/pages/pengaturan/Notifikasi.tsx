import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNotification } from "@/hooks/useNotification";
import { toast } from "@/hooks/use-toast";
import { Bell, Clock, Calendar } from "lucide-react";

const DAYS = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
];

const Notifikasi = () => {
  const { permission, settings, requestPermission, updateSettings, sendNotification } = useNotification();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleSave();
      // Reload to refresh UI
      window.location.reload();
    }
  };

  const handleToggleDay = (day: string) => {
    const days = localSettings.days.includes(day)
      ? localSettings.days.filter(d => d !== day)
      : [...localSettings.days, day];
    setLocalSettings({ ...localSettings, days });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      variant: "success",
      title: "Pengaturan Disimpan",
      description: "Pengaturan notifikasi berhasil disimpan",
    });
  };

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast({
        title: "Izin Diperlukan",
        description: "Aktifkan izin notifikasi terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    sendNotification('Notifikasi Test', {
      body: 'Ini adalah notifikasi percobaan dari EduShift Panel',
      tag: 'test-notification',
    });

    toast({
      variant: "success",
      title: "Notifikasi Dikirim",
      description: "Periksa notifikasi Anda",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Pengaturan Notifikasi"
        description="Atur pengingat dan notifikasi untuk kegiatan mengajar"
      />

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status Notifikasi
          </CardTitle>
          <CardDescription>
            Kelola izin dan status notifikasi browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status Izin</p>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' ? 'Diizinkan' : 
                 permission === 'denied' ? 'Ditolak' : 'Belum Diatur'}
              </p>
            </div>
            {permission !== 'granted' && (
              <Button onClick={handleRequestPermission}>
                Izinkan Notifikasi
              </Button>
            )}
          </div>

          {permission === 'granted' && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Aktifkan Notifikasi</Label>
                  <p className="text-sm text-muted-foreground">
                    Nyalakan atau matikan semua notifikasi
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={localSettings.enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, enabled: checked })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {permission === 'granted' && (
        <>
          {/* Time Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waktu Notifikasi
              </CardTitle>
              <CardDescription>
                Atur jam berapa notifikasi dapat muncul
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Jam Mulai</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={localSettings.startTime}
                    onChange={(e) => 
                      setLocalSettings({ ...localSettings, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Jam Selesai</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={localSettings.endTime}
                    onChange={(e) => 
                      setLocalSettings({ ...localSettings, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Days */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Hari Aktif
              </CardTitle>
              <CardDescription>
                Pilih hari mana saja notifikasi dapat muncul
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DAYS.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Switch
                      id={day.value}
                      checked={localSettings.days.includes(day.value)}
                      onCheckedChange={() => handleToggleDay(day.value)}
                    />
                    <Label htmlFor={day.value}>{day.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Jenis Notifikasi</CardTitle>
              <CardDescription>
                Pilih notifikasi apa saja yang ingin diterima
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="journalReminder">Pengingat Jurnal Mengajar</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifikasi untuk mengisi jurnal mengajar
                  </p>
                </div>
                <Switch
                  id="journalReminder"
                  checked={localSettings.journalReminder}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, journalReminder: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scheduleReminder">Pengingat Jadwal Mengajar</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifikasi sebelum jadwal mengajar dimulai
                  </p>
                </div>
                <Switch
                  id="scheduleReminder"
                  checked={localSettings.scheduleReminder}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, scheduleReminder: checked })
                  }
                />
              </div>

              {localSettings.scheduleReminder && (
                <div className="pl-6 space-y-2">
                  <Label htmlFor="reminderBefore">Waktu Pengingat</Label>
                  <Select
                    value={String(localSettings.reminderBeforeMinutes)}
                    onValueChange={(value) => 
                      setLocalSettings({ ...localSettings, reminderBeforeMinutes: Number(value) })
                    }
                  >
                    <SelectTrigger id="reminderBefore">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 menit sebelum</SelectItem>
                      <SelectItem value="10">10 menit sebelum</SelectItem>
                      <SelectItem value="15">15 menit sebelum</SelectItem>
                      <SelectItem value="30">30 menit sebelum</SelectItem>
                      <SelectItem value="60">1 jam sebelum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  Simpan Pengaturan
                </Button>
                <Button onClick={handleTestNotification} variant="outline">
                  Test Notifikasi
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Notifikasi;
