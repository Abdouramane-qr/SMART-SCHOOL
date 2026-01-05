import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { laravelSchoolYearsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface AddSchoolYearDialogProps {
  onSuccess: () => void;
}

export function AddSchoolYearDialog({ onSuccess }: AddSchoolYearDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    name: `${currentYear}-${currentYear + 1}`,
    start_date: `${currentYear}-09-01`,
    end_date: `${currentYear + 1}-06-30`,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
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
      await laravelSchoolYearsApi.create({
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_current: false,
      });

      toast({
        title: "Succès",
        description: "Année scolaire ajoutée avec succès",
      });

      const nextYear = currentYear + 1;
      setFormData({
        name: `${nextYear}-${nextYear + 1}`,
        start_date: `${nextYear}-09-01`,
        end_date: `${nextYear + 1}-06-30`,
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding school year:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'année scolaire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle année
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une année scolaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de l'année *</Label>
            <Input
              id="name"
              placeholder="Ex: 2024-2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="start_date">Date de début *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end_date">Date de fin *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
