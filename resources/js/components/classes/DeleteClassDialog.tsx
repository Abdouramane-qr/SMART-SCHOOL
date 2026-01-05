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
import { laravelClassesApi, type LaravelClasse } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";
interface DeleteClassDialogProps {
  classData: LaravelClasse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteClassDialog({
  classData,
  open,
  onOpenChange,
  onSuccess,
}: DeleteClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!classData) return;

    setLoading(true);
    try {
      await laravelClassesApi.delete(classData.id);

      toast({
        title: "Succès",
        description: "La classe a été supprimée avec succès.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression. Vérifiez qu'aucun élève n'est inscrit.",
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
            Cette action est irréversible. La classe{" "}
            <strong>{classData?.name}</strong> sera définitivement supprimée.
            <br />
            <br />
            <span className="text-destructive">
              Attention : Supprimez d'abord les élèves inscrits dans cette classe.
            </span>
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
