import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { laravelTeacherAuditsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { History, ArrowRight } from "lucide-react";

interface TeacherAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
}

export function TeacherAuditModal({ open, onOpenChange, teacher }: TeacherAuditModalProps) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher && open) {
      fetchAuditLogs();
    }
  }, [teacher, open]);

  const fetchAuditLogs = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const data = await laravelTeacherAuditsApi.getByTeacherId(teacher.id);
      setAuditLogs(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return <Badge className="bg-green-500">Création</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500">Modification</Badge>;
      case "DELETE":
        return <Badge variant="destructive">Suppression</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const renderChanges = (oldData: any, newData: any) => {
    if (!oldData && newData) {
      return (
        <div className="text-sm text-muted-foreground">
          Données initiales: {JSON.stringify(newData, null, 2)}
        </div>
      );
    }

    if (oldData && !newData) {
      return (
        <div className="text-sm text-muted-foreground">
          Données supprimées: {JSON.stringify(oldData, null, 2)}
        </div>
      );
    }

    if (oldData && newData) {
      const changes: string[] = [];
      Object.keys(newData).forEach((key) => {
        if (oldData[key] !== newData[key]) {
          changes.push(`${key}: "${oldData[key] || 'N/A'}" → "${newData[key] || 'N/A'}"`);
        }
      });
      return (
        <div className="space-y-1">
          {changes.map((change, index) => (
            <div key={index} className="text-sm flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-primary" />
              {change}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique des modifications - {teacher?.profiles?.full_name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune modification enregistrée
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionBadge(log.action)}
                    <span className="text-sm text-muted-foreground">
                      par {log.profiles?.full_name || "Système"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.changed_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                {renderChanges(log.old_data, log.new_data)}
                {log.notes && (
                  <p className="text-sm italic text-muted-foreground">
                    Note: {log.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
