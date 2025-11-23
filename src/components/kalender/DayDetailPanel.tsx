import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Calendar, BookOpen, Users, FileText, X, StickyNote, PartyPopper, Edit, Trash2, AlertCircle } from "lucide-react";
import type { JadwalPelajaran, AgendaMengajar, Jurnal, CatatanKalender, HariLibur, PeriodeNonPembelajaran } from "@/lib/indexedDB";

interface DayDetailPanelProps {
  selectedDate: Date | null;
  schedules: Array<JadwalPelajaran & { kelas_name?: string; mata_pelajaran_name?: string; jam_mulai?: string; jam_selesai?: string }>;
  agendas: Array<AgendaMengajar & { kelas_name?: string; mata_pelajaran_name?: string }>;
  journals: Jurnal[];
  attendanceCount: number;
  notes?: CatatanKalender[];
  holiday?: HariLibur;
  periode?: PeriodeNonPembelajaran;
  onClose: () => void;
  onEditNote?: (note: CatatanKalender) => void;
  onDeleteNote?: (noteId: string) => void;
}

export function DayDetailPanel({
  selectedDate,
  schedules,
  agendas,
  journals,
  attendanceCount,
  notes = [],
  holiday,
  periode,
  onClose,
  onEditNote,
  onDeleteNote,
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
        {/* Hari Libur */}
        {holiday && (
          <>
            <div className="p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <PartyPopper className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">{holiday.nama}</h3>
                  {holiday.keterangan && (
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{holiday.keterangan}</p>
                  )}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Periode Non-Pembelajaran */}
        {periode && !holiday && (
          <>
            <div className="p-4 bg-orange-50 dark:bg-orange-950 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-600 dark:text-orange-400">{periode.nama}</h3>
                  {periode.keterangan && (
                    <p className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">{periode.keterangan}</p>
                  )}
                  <p className="text-xs text-orange-600/60 dark:text-orange-400/60 mt-1">
                    {format(new Date(periode.tanggal_mulai), "dd MMM", { locale: id })} - {format(new Date(periode.tanggal_selesai), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

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
                <div key={agenda.id} className="text-sm p-2 bg-green-500/10 border border-green-500/20 rounded-md space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{agenda.mata_pelajaran_name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{agenda.kelas_name}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Materi Terakhir: </span>
                    {agenda.materi}
                  </div>
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
            <Badge variant="secondary">{attendanceCount} siswa tercatat</Badge>
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
                  <div className="text-xs line-clamp-2">{journal.uraian_kegiatan}</div>
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
                <div key={note.id} className="text-sm p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md group relative">
                  <p className="pr-16">{note.catatan}</p>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditNote && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditNote(note)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {onDeleteNote && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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
