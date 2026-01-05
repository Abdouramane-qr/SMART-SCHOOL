import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { laravelSchoolYearsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface EditSchoolYearDialogProps {
  schoolYear: SchoolYear | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSchoolYearDialog({
  schoolYear,
  open,
  onOpenChange,
  onSuccess,
}: EditSchoolYearDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (schoolYear) {
      setFormData({
        name: schoolYear.name,
        start_date: schoolYear.start_date,
        end_date: schoolYear.end_date,
      });
    }
  }, [schoolYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolYear || !formData.name.trim() || !formData.start_date || !formData.end_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelSchoolYearsApi.update(schoolYear.id, {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      toast({
        title: "Succès",
        description: "Année scolaire modifiée avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating school year:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'année scolaire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'année scolaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nom de l'année *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-start_date">Date de début *</Label>
            <Input
              id="edit-start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-end_date">Date de fin *</Label>
            <Input
              id="edit-end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
