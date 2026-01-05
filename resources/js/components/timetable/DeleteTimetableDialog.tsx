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
import { laravelTimetableApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface TimetableEntry {
  id: string;
  subjects?: { name: string } | null;
  classes?: { name: string } | null;
}

interface DeleteTimetableDialogProps {
  entry: TimetableEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteTimetableDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTimetableDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!entry) return;

    setIsLoading(true);
    try {
      await laravelTimetableApi.delete(entry.id);

      toast({
        title: "Succès",
        description: "Cours supprimé avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting timetable entry:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le cours",
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
            Êtes-vous sûr de vouloir supprimer le cours{" "}
            <strong>{entry?.subjects?.name}</strong> pour la classe{" "}
            <strong>{entry?.classes?.name}</strong> ?
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
