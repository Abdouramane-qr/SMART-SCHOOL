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
import { laravelClassroomsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface AddClassroomDialogProps {
  onSuccess: () => void;
}

export function AddClassroomDialog({ onSuccess }: AddClassroomDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: "",
    capacity: "30",
    equipment: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la salle est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelClassroomsApi.create({
        name: formData.name.trim(),
        building: formData.building.trim() || undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        capacity: parseInt(formData.capacity) || 30,
        equipment: formData.equipment
          ? formData.equipment.split(",").map((e) => e.trim()).filter(Boolean)
          : undefined,
      });

      toast({
        title: "Succès",
        description: "Salle ajoutée avec succès",
      });

      setFormData({
        name: "",
        building: "",
        floor: "",
        capacity: "30",
        equipment: "",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding classroom:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la salle",
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
          Nouvelle salle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une salle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la salle *</Label>
            <Input
              id="name"
              placeholder="Ex: Salle 101"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="building">Bâtiment</Label>
              <Input
                id="building"
                placeholder="Ex: Bâtiment A"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="floor">Étage</Label>
              <Input
                id="floor"
                type="number"
                placeholder="0"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">Capacité</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="equipment">Équipements (séparés par virgule)</Label>
            <Input
              id="equipment"
              placeholder="Ex: Projecteur, Tableau blanc, WiFi"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
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
