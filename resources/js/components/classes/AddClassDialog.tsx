import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { laravelClassesApi, laravelSchoolYearsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AddClassDialogProps {
  onSuccess: () => void;
}

const levels = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Tle"];

export function AddClassDialog({ onSuccess }: AddClassDialogProps) {
  const [open, setOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await laravelClassesApi.create({
        name: formData.name,
        level: formData.level,
        capacity: formData.capacity,
        school_year_id: formData.school_year_id ? Number(formData.school_year_id) : null,
      });

      toast({
        title: "Succès",
        description: "La classe a été ajoutée avec succès.",
      });

      setFormData({ name: "", level: "", capacity: 30, school_year_id: "" });
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la classe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-blue">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle classe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une classe</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer une nouvelle classe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de la classe *</Label>
              <Input
                id="name"
                placeholder="Ex: 6ème A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Niveau *</Label>
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
              <Label htmlFor="capacity">Capacité</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school_year">Année scolaire</Label>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
