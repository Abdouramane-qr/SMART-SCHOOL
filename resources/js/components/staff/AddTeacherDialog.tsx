import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { laravelTeachersApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/financeUtils";
import { useFinanceCurrency } from "@/hooks/useFinanceCurrency";

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTeacherDialog({ open, onOpenChange, onSuccess }: AddTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const { defaultCurrency } = useFinanceCurrency();
  const currencySymbol = CURRENCIES[defaultCurrency]?.symbol ?? defaultCurrency;
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    monthly_salary: "",
    hire_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [firstName, ...rest] = formData.full_name.trim().split(" ");
      const lastName = rest.join(" ");

      await laravelTeachersApi.create({
        first_name: firstName || formData.full_name,
        last_name: lastName || null,
        email: formData.email,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        monthly_salary: formData.monthly_salary ? parseFloat(formData.monthly_salary) : 0,
        hire_date: formData.hire_date || null,
      });

      toast.success("Enseignant ajouté avec succès");
      onSuccess();
      onOpenChange(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        specialization: "",
        monthly_salary: "",
        hire_date: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de l'enseignant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel Enseignant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Spécialisation</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="ex: Mathématiques"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_salary">Salaire mensuel ({currencySymbol})</Label>
              <Input
                id="monthly_salary"
                type="number"
                value={formData.monthly_salary}
                onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">Date d'embauche</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
