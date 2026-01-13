import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { laravelStudentAuditsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StudentAuditModalProps {
  studentId: string | null;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLog {
  id: string;
  action: string;
  old_data: any;
  new_data: any;
  changed_at: string;
  notes: string | null;
  profiles: {
    full_name: string;
  } | null;
}

export function StudentAuditModal({ studentId, studentName, isOpen, onClose }: StudentAuditModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchAuditLogs();
    }
  }, [isOpen, studentId]);

  const fetchAuditLogs = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await laravelStudentAuditsApi.getByStudentId(studentId);
      setLogs(data || []);
    } catch (error) {
      setError("Historique indisponible pour le moment.");
      setLogs([]);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actions: Record<string, { label: string; variant: "success" | "info" | "destructive" }> = {
      INSERT: { label: "Création", variant: "success" },
      UPDATE: { label: "Modification", variant: "info" },
      DELETE: { label: "Suppression", variant: "destructive" },
    };
    const actionInfo = actions[action] || { label: action, variant: "info" };
    return <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>;
  };

  const getChangedFields = (oldData: any, newData: any) => {
    if (!oldData || !newData) return [];
    
    const changes: { field: string; old: any; new: any }[] = [];
    const fields: Record<string, string> = {
      full_name: "Nom complet",
      student_id: "ID Élève",
      gender: "Genre",
      date_of_birth: "Date de naissance",
      address: "Adresse",
      parent_name: "Nom du parent",
      parent_phone: "Téléphone parent",
      parent_email: "Email parent",
    };

    Object.keys(fields).forEach((key) => {
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: fields[key],
          old: oldData[key] || "—",
          new: newData[key] || "—",
        });
      }
    });

    return changes;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historique des modifications</DialogTitle>
          <p className="text-sm text-muted-foreground">Élève: {studentName}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-neutral"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <button
              type="button"
              className="mt-4 text-sm text-primary underline"
              onClick={fetchAuditLogs}
            >
              Réessayer
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun historique disponible
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.changed_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </span>
                    </div>
                    {log.profiles && (
                      <span className="text-sm">Par: {log.profiles.full_name}</span>
                    )}
                  </div>

                  {log.action === "UPDATE" && log.old_data && log.new_data && (
                    <div className="space-y-2">
                      {getChangedFields(log.old_data, log.new_data).map((change, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{change.field}:</span>{" "}
                          <span className="text-brand-neutral line-through">{change.old}</span>{" "}
                          <span className="text-primary">→ {change.new}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.notes && (
                    <p className="text-sm text-muted-foreground italic">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
