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
import { laravelSubjectsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number | null;
}

interface EditSubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSubjectDialog({
  subject,
  open,
  onOpenChange,
  onSuccess,
}: EditSubjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    coefficient: "1",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        coefficient: (subject.coefficient || 1).toString(),
      });
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelSubjectsApi.update(subject.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        coefficient: parseInt(formData.coefficient) || 1,
      });

      toast({
        title: "Succès",
        description: "Matière modifiée avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la matière",
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
          <DialogTitle>Modifier la matière</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-code">Code *</Label>
            <Input
              id="edit-code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="uppercase"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nom de la matière *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-coefficient">Coefficient</Label>
            <Input
              id="edit-coefficient"
              type="number"
              min="1"
              max="10"
              value={formData.coefficient}
              onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
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
