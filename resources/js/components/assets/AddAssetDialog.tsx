import { useState } from "react";
import { laravelAssetsApi } from "@/services/laravelSchoolApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AssetCategory = "mobilier" | "informatique" | "pedagogique" | "sportif" | "vehicule" | "autre";
type AssetStatus = "actif" | "panne" | "vendu";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: "mobilier", label: "Mobilier" },
  { value: "informatique", label: "Informatique" },
  { value: "pedagogique", label: "Pédagogique" },
  { value: "sportif", label: "Sportif" },
  { value: "vehicule", label: "Véhicule" },
  { value: "autre", label: "Autre" },
];

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "actif", label: "Actif" },
  { value: "panne", label: "En panne" },
  { value: "vendu", label: "Vendu" },
];

export function AddAssetDialog({ open, onOpenChange, onSuccess }: AddAssetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "autre" as AssetCategory,
    status: "actif" as AssetStatus,
    acquisition_date: "",
    acquisition_value: "",
    current_value: "",
    location: "",
    serial_number: "",
    supplier: "",
    warranty_end_date: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await laravelAssetsApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        status: formData.status,
        acquisition_date: formData.acquisition_date || null,
        acquisition_value: formData.acquisition_value ? parseFloat(formData.acquisition_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
        location: formData.location.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        supplier: formData.supplier.trim() || null,
        warranty_end_date: formData.warranty_end_date || null,
        notes: formData.notes.trim() || null,
      });

      toast({
        title: "Succès",
        description: "Actif créé avec succès",
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        category: "autre",
        status: "actif",
        acquisition_date: "",
        acquisition_value: "",
        current_value: "",
        location: "",
        serial_number: "",
        supplier: "",
        warranty_end_date: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error creating asset:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'actif",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel Actif</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ordinateur Dell"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Numéro de série</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Ex: SN123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value: AssetCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">État</Label>
              <Select
                value={formData.status}
                onValueChange={(value: AssetStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquisition_date">Date d'acquisition</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisition_value">Valeur d'acquisition (XOF)</Label>
              <Input
                id="acquisition_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.acquisition_value}
                onChange={(e) => setFormData({ ...formData, acquisition_value: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_value">Valeur actuelle (XOF)</Label>
              <Input
                id="current_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Salle informatique A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Ex: Tech Solutions SARL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_end_date">Fin de garantie</Label>
              <Input
                id="warranty_end_date"
                type="date"
                value={formData.warranty_end_date}
                onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée de l'actif..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
