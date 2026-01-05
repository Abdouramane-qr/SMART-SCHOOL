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
import { laravelSubjectsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface AddSubjectDialogProps {
  onSuccess: () => void;
}

export function AddSubjectDialog({ onSuccess }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    coefficient: "1",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelSubjectsApi.create({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        coefficient: parseInt(formData.coefficient) || 1,
      });

      toast({
        title: "Succès",
        description: "Matière ajoutée avec succès",
      });

      setFormData({ name: "", code: "", coefficient: "1" });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la matière",
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
          Nouvelle matière
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une matière</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              placeholder="Ex: MATH, FR, HG..."
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="uppercase"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la matière *</Label>
            <Input
              id="name"
              placeholder="Ex: Mathématiques"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coefficient">Coefficient</Label>
            <Input
              id="coefficient"
              type="number"
              min="1"
              max="10"
              value={formData.coefficient}
              onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
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
