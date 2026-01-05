import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { laravelTeachersApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";

interface DeleteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  onSuccess: () => void;
}

export function DeleteTeacherDialog({ open, onOpenChange, teacher, onSuccess }: DeleteTeacherDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!teacher) return;
    setLoading(true);

    try {
      await laravelTeachersApi.delete(teacher.id);

      toast.success("Enseignant supprimé avec succès");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'enseignant{" "}
            <strong>{teacher?.profiles?.full_name}</strong> ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
