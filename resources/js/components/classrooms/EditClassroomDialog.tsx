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
import { laravelClassroomsApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  building: string | null;
  floor: number | null;
  equipment: string[] | null;
}

interface EditClassroomDialogProps {
  classroom: Classroom | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditClassroomDialog({
  classroom,
  open,
  onOpenChange,
  onSuccess,
}: EditClassroomDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: "",
    capacity: "30",
    equipment: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name,
        building: classroom.building || "",
        floor: classroom.floor?.toString() || "",
        capacity: (classroom.capacity || 30).toString(),
        equipment: classroom.equipment?.join(", ") || "",
      });
    }
  }, [classroom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom || !formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la salle est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await laravelClassroomsApi.update(classroom.id, {
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
        description: "Salle modifiée avec succès",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating classroom:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la salle",
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
          <DialogTitle>Modifier la salle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nom de la salle *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-building">Bâtiment</Label>
              <Input
                id="edit-building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-floor">Étage</Label>
              <Input
                id="edit-floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-capacity">Capacité</Label>
            <Input
              id="edit-capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-equipment">Équipements (séparés par virgule)</Label>
            <Input
              id="edit-equipment"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
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
