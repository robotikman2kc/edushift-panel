import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Calendar, BookOpen, Users, FileText, X, StickyNote } from "lucide-react";
import type { JadwalPelajaran, AgendaMengajar, Jurnal, CatatanKalender } from "@/lib/indexedDB";

interface DayDetailPanelProps {
  selectedDate: Date | null;
  schedules: Array<JadwalPelajaran & { kelas_name?: string; mata_pelajaran_name?: string; jam_mulai?: string; jam_selesai?: string }>;
  agendas: Array<AgendaMengajar & { kelas_name?: string; mata_pelajaran_name?: string }>;
  journals: Jurnal[];
  attendanceCount: number;
  notes?: CatatanKalender[];
  onClose: () => void;
}

export function DayDetailPanel({
  selectedDate,
  schedules,
  agendas,
  journals,
  attendanceCount,
  notes = [],
  onClose,
}: DayDetailPanelProps) {
  const navigate = useNavigate();

  if (!selectedDate) return null;

  const formattedDate = format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id });

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {formattedDate}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jadwal Hari Ini */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Jadwal Hari Ini
          </h3>
          {schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map((schedule, idx) => (
                <div key={idx} className="text-sm p-2 bg-muted rounded-md">
                  <div className="font-medium">{schedule.mata_pelajaran_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {schedule.kelas_name} • {schedule.jam_mulai} - {schedule.jam_selesai}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada jadwal</p>
          )}
        </div>

        <Separator />

        {/* Agenda */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Agenda Mengajar
          </h3>
          {agendas.length > 0 ? (
            <div className="space-y-2">
              {agendas.map((agenda) => (
                <div key={agenda.id} className="text-sm p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                  <div className="font-medium">{agenda.mata_pelajaran_name}</div>
                  <div className="text-xs text-muted-foreground">{agenda.kelas_name}</div>
                  <div className="text-xs mt-1">{agenda.materi}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada agenda</p>
          )}
        </div>

        <Separator />

        {/* Kehadiran */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Status Kehadiran
          </h3>
          {attendanceCount > 0 ? (
            <Badge variant="secondary">{attendanceCount} kelas tercatat</Badge>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada input kehadiran</p>
          )}
        </div>

        <Separator />

        {/* Jurnal */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Jurnal Guru
          </h3>
          {journals.length > 0 ? (
            <div className="space-y-2">
              {journals.map((journal) => (
                <div key={journal.id} className="text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <div className="font-medium">Jurnal Guru</div>
                  <div className="text-xs mt-1 line-clamp-2">{journal.uraian_kegiatan}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada jurnal</p>
          )}
        </div>

        <Separator />

        {/* Catatan Kegiatan */}
        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Catatan Kegiatan
          </h3>
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="text-sm p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  {note.catatan}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada catatan</p>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm mb-2">Quick Actions</h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => navigate("/jurnal/agenda-mengajar")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Tambah Agenda
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => navigate("/kehadiran/input")}
          >
            <Users className="h-4 w-4 mr-2" />
            Input Kehadiran
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => navigate("/jurnal")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Tulis Jurnal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
