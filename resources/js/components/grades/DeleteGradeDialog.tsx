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
import { Loader2 } from "lucide-react";
import { laravelGradesApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface GradeWithRelations {
  id: string;
  students?: { full_name: string } | null;
  subjects?: { name: string } | null;
}

interface DeleteGradeDialogProps {
  grade: GradeWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteGradeDialog({
  grade,
  open,
  onOpenChange,
  onSuccess,
}: DeleteGradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!grade) return;

    setLoading(true);
    try {
      await laravelGradesApi.delete(grade.id);

      toast({
        title: "Succès",
        description: "La note a été supprimée avec succès.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La note de{" "}
            <strong>{grade?.students?.full_name}</strong> en{" "}
            <strong>{grade?.subjects?.name}</strong> sera définitivement supprimée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
