import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Plus, Edit, Trash2, Calendar, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laravelTimetableApi, laravelClassesApi } from "@/services/laravelSchoolApi";
import { AddTimetableDialog } from "@/components/timetable/AddTimetableDialog";
import { EditTimetableDialog } from "@/components/timetable/EditTimetableDialog";
import { DeleteTimetableDialog } from "@/components/timetable/DeleteTimetableDialog";
import { RoleGuard } from "@/components/RoleGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { TIME_SLOTS, DAYS_LABELS, getSubjectColor, formatDuration, calculateDuration } from "@/lib/timetableUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimetableEntry {
  id: string;
  class_id: string | number;
  subject_id: string | number;
  teacher_id: string | number | null;
  classroom_id: string | number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes?: { name: string } | null;
  subjects?: { name: string; code: string } | null;
  teachers?: { id: string; profiles: { full_name: string } | null } | null;
  classrooms?: { name: string } | null;
}

export default function Timetable() {
  const [filterClass, setFilterClass] = useState<string>("all");
  const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimetableEntry | null>(null);
  const { hasAnyRole, hasAnyPermission } = useUserRole();

  const canEdit =
    hasAnyPermission(["timetable.create", "timetable.update"]) ||
    hasAnyRole(["admin"]);

  const { data: timetable = [], isLoading, refetch } = useQuery({
    queryKey: ["timetable"],
    queryFn: laravelTimetableApi.getAll,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: laravelClassesApi.getAll,
  });

  const filteredTimetable = (timetable as TimetableEntry[]).filter((entry) => 
    filterClass === "all" || String(entry.class_id) === filterClass
  );

  // Group by day and find entries that span the time slot
  const getEntriesForDayAndTime = (day: number, startHour: number) => {
    return filteredTimetable.filter((entry) => {
      const entryStartHour = parseInt(entry.start_time.split(":")[0]);
      const entryEndHour = parseInt(entry.end_time.split(":")[0]);
      const entryEndMin = parseInt(entry.end_time.split(":")[1]);
      
      // Check if this entry starts at this hour OR spans this hour
      return entry.day_of_week === day && 
             entryStartHour === startHour;
    });
  };

  const handleEntryClick = (entry: TimetableEntry) => {
    if (canEdit) {
      setEditEntry(entry);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Emploi du temps</h1>
          <p className="text-muted-foreground mt-1">
            Plage horaire: 07:00 - 18:00 • Durée variable des cours
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={String(cls.id)}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RoleGuard allowedRoles={["admin"]} allowedPermissions={["timetable.create"]}>
            <AddTimetableDialog onSuccess={refetch} />
          </RoleGuard>
        </div>
      </div>

      {/* Info Banner for non-admin users */}
      <RoleGuard allowedRoles={["enseignant", "eleve", "parent"]} allowedPermissions={["timetable.view_any", "timetable.view"]}>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Mode consultation uniquement. Contactez un administrateur pour modifier l'emploi du temps.
          </span>
        </div>
      </RoleGuard>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border p-2 bg-muted text-left min-w-[80px]">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Heure
                    </th>
                    {[1, 2, 3, 4, 5, 6].map((day) => (
                      <th key={day} className="border border-border p-2 bg-muted text-center min-w-[150px]">
                        {DAYS_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time) => {
                    const hour = parseInt(time.split(":")[0]);
                    return (
                      <tr key={time}>
                        <td className="border border-border p-2 bg-muted/50 font-medium text-sm">
                          {time}
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((day) => {
                          const entries = getEntriesForDayAndTime(day, hour);
                          return (
                            <td key={day} className="border border-border p-1 align-top">
                              {entries.map((entry) => {
                                const duration = calculateDuration(entry.start_time, entry.end_time);
                                return (
                                  <Tooltip key={entry.id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`p-2 rounded-md border text-xs mb-1 transition-opacity ${getSubjectColor(entry.subject_id)} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                        onClick={() => handleEntryClick(entry)}
                                      >
                                        <div className="font-bold text-foreground">
                                          {entry.subjects?.name || "N/A"}
                                        </div>
                                        {filterClass === "all" && (
                                          <div className="text-muted-foreground">
                                            {entry.classes?.name}
                                          </div>
                                        )}
                                        <div className="text-muted-foreground">
                                          {entry.teachers?.profiles?.full_name || "N/A"}
                                        </div>
                                        {entry.classrooms && (
                                          <Badge variant="outline" className="mt-1 text-[10px]">
                                            {entry.classrooms.name}
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                                          <Clock className="h-3 w-3" />
                                          {entry.start_time} - {entry.end_time}
                                          <span className="text-primary font-medium">
                                            ({formatDuration(duration)})
                                          </span>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p className="font-semibold">{entry.subjects?.name}</p>
                                        <p>Durée: {formatDuration(duration)}</p>
                                        <p>Salle: {entry.classrooms?.name || "Non assignée"}</p>
                                        {canEdit && <p className="text-xs italic">Cliquer pour modifier</p>}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List View for Mobile */}
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle>Liste des cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTimetable.map((entry) => {
              const duration = calculateDuration(entry.start_time, entry.end_time);
              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${getSubjectColor(entry.subject_id)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{entry.subjects?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {DAYS_LABELS[entry.day_of_week]} • {entry.start_time} - {entry.end_time}
                        <span className="ml-1 text-primary">({formatDuration(duration)})</span>
                      </p>
                      <p className="text-sm">{entry.classes?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.teachers?.profiles?.full_name}
                      </p>
                    </div>
                    <RoleGuard allowedRoles={["admin"]}>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </RoleGuard>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs - Only for admin */}
      {canEdit && (
        <>
          <EditTimetableDialog
            entry={editEntry}
            open={!!editEntry}
            onOpenChange={(open) => !open && setEditEntry(null)}
            onSuccess={refetch}
          />
          <DeleteTimetableDialog
            entry={deleteEntry}
            open={!!deleteEntry}
            onOpenChange={(open) => !open && setDeleteEntry(null)}
            onSuccess={refetch}
          />
        </>
      )}
    </div>
  );
}
