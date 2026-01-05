import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { laravelTeachersApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/financeUtils";
import { useFinanceCurrency } from "@/hooks/useFinanceCurrency";

interface EditTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
  onSuccess: () => void;
}

export function EditTeacherDialog({ open, onOpenChange, teacher, onSuccess }: EditTeacherDialogProps) {
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

  useEffect(() => {
    if (teacher) {
      setFormData({
        full_name: teacher.profiles?.full_name || "",
        email: teacher.profiles?.email || "",
        phone: teacher.profiles?.phone || "",
        specialization: teacher.specialization || "",
        monthly_salary: teacher.monthly_salary?.toString() || "",
        hire_date: teacher.hire_date || "",
      });
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setLoading(true);

    try {
      const [firstName, ...rest] = formData.full_name.trim().split(" ");
      const lastName = rest.join(" ");

      await laravelTeachersApi.update(teacher.id, {
        first_name: firstName || formData.full_name,
        last_name: lastName || null,
        email: formData.email,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        monthly_salary: formData.monthly_salary ? parseFloat(formData.monthly_salary) : 0,
        hire_date: formData.hire_date || null,
      });

      toast.success("Enseignant mis à jour avec succès");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'enseignant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nom complet *</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Téléphone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_specialization">Spécialisation</Label>
              <Input
                id="edit_specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_monthly_salary">Salaire mensuel ({currencySymbol})</Label>
              <Input
                id="edit_monthly_salary"
                type="number"
                value={formData.monthly_salary}
                onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_hire_date">Date d'embauche</Label>
              <Input
                id="edit_hire_date"
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
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
