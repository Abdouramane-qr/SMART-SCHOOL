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
import { laravelStudentsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";

interface DeleteStudentDialogProps {
  student: {
    id: string;
    full_name: string;
    student_id: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteStudentDialog({ student, isOpen, onClose, onSuccess }: DeleteStudentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!student) return;

    try {
      setIsDeleting(true);

      await laravelStudentsApi.delete(student.id);

      toast.success("Élève supprimé avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!student) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'élève{" "}
            <span className="font-semibold">{student.full_name}</span> ({student.student_id}) ?
            <br />
            <br />
            <span className="text-destructive">
              Cette action est irréversible. Toutes les données associées (inscriptions, paiements, notes) seront également supprimées.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
