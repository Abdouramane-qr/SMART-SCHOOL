import { useState } from "react";
import { laravelAssetsApi } from "@/services/laravelSchoolApi";
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
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Asset {
  id: string | number;
  name: string;
}

interface DeleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onSuccess: () => void;
}

export function DeleteAssetDialog({ open, onOpenChange, asset, onSuccess }: DeleteAssetDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await laravelAssetsApi.delete(asset.id);

      toast({
        title: "Succès",
        description: "Actif supprimé avec succès",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'actif",
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
          <AlertDialogTitle>Supprimer l'actif</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'actif "{asset.name}" ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
