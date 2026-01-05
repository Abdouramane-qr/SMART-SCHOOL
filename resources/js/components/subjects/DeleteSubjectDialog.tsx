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
import { laravelSubjectsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface DeleteSubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSubjectDialog({
  subject,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!subject) return;

    setIsLoading(true);
    try {
      await laravelSubjectsApi.delete(subject.id);

      toast({
        title: "Succès",
        description: "Matière supprimée avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la matière. Elle est peut-être utilisée dans des notes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer la matière{" "}
            <strong>{subject?.name}</strong> ({subject?.code}) ?
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
