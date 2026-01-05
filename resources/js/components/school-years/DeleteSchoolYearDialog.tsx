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
import { laravelSchoolYearsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface SchoolYear {
  id: string;
  name: string;
  is_current: boolean | null;
}

interface DeleteSchoolYearDialogProps {
  schoolYear: SchoolYear | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSchoolYearDialog({
  schoolYear,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSchoolYearDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!schoolYear) return;

    if (schoolYear.is_current) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'année scolaire courante",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelSchoolYearsApi.delete(schoolYear.id);

      toast({
        title: "Succès",
        description: "Année scolaire supprimée avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting school year:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'année scolaire",
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
            Êtes-vous sûr de vouloir supprimer l'année scolaire{" "}
            <strong>{schoolYear?.name}</strong> ?
            Cette action est irréversible et supprimera toutes les données associées.
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
