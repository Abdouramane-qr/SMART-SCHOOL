import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { laravelClassesApi, laravelSchoolYearsApi, type LaravelClasse } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
interface EditClassDialogProps {
  classData: LaravelClasse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const levels = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Tle"];

export function EditClassDialog({
  classData,
  open,
  onOpenChange,
  onSuccess,
}: EditClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    level: "",
    capacity: 30,
    school_year_id: "",
  });

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["school-years"],
    queryFn: laravelSchoolYearsApi.getAll,
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        level: classData.level,
        capacity: classData.capacity || 30,
        school_year_id: classData.school_year_id ? String(classData.school_year_id) : "",
      });
    }
  }, [classData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;

    if (!formData.name || !formData.level) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await laravelClassesApi.update(classData.id, {
        name: formData.name,
        level: formData.level,
        capacity: formData.capacity,
        school_year_id: formData.school_year_id ? Number(formData.school_year_id) : null,
      });

      toast({
        title: "Succès",
        description: "La classe a été modifiée avec succès.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la classe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom de la classe *</Label>
              <Input
                id="edit-name"
                placeholder="Ex: 6ème A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-level">Niveau *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-capacity">Capacité</Label>
              <Input
                id="edit-capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-school_year">Année scolaire</Label>
              <Select
                value={formData.school_year_id}
                onValueChange={(value) => setFormData({ ...formData, school_year_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
