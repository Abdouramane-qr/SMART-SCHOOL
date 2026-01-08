import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { laravelSalariesApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, DollarSign } from "lucide-react";
import { formatAmount, CURRENCIES } from "@/lib/financeUtils";
import { useFinanceCurrency } from "@/hooks/useFinanceCurrency";

interface TeacherSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: any;
}

export function TeacherSalaryDialog({ open, onOpenChange, teacher }: TeacherSalaryDialogProps) {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { defaultCurrency } = useFinanceCurrency();
  const currencySymbol = CURRENCIES[defaultCurrency]?.symbol ?? defaultCurrency;
  const [formData, setFormData] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    amount: "",
    bonus: "0",
    deductions: "0",
    payment_date: "",
    notes: "",
  });

  useEffect(() => {
    if (teacher && open) {
      fetchSalaries();
      setFormData((prev) => ({
        ...prev,
        amount: teacher.monthly_salary?.toString() || "",
      }));
    }
  }, [teacher, open]);

  const fetchSalaries = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const data = await laravelSalariesApi.getByTeacherId(teacher.id);
      setSalaries(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des salaires");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const bonus = parseFloat(formData.bonus) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const netAmount = amount + bonus - deductions;

      await laravelSalariesApi.create({
        teacher_id: teacher.id,
        month: formData.month,
        year: parseInt(formData.year),
        amount,
        bonus,
        deductions,
        net_amount: netAmount,
        payment_date: formData.payment_date,
        notes: formData.notes || null,
      });

      toast.success("Salaire enregistré avec succès");
      setShowForm(false);
      fetchSalaries();
      setFormData({
        month: "",
        year: new Date().getFullYear().toString(),
        amount: teacher.monthly_salary?.toString() || "",
        bonus: "0",
        deductions: "0",
        payment_date: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayAmount = (amount: number) => formatAmount(amount, defaultCurrency);

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Gestion des salaires - {teacher?.profiles?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Salaire de base: <strong>{formatDisplayAmount(teacher?.monthly_salary || 0)}</strong>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau paiement
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mois *</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Année *</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant brut ({currencySymbol}) *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prime ({currencySymbol})</Label>
                  <Input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retenues ({currencySymbol})</Label>
                  <Input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de paiement *</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes optionnelles..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead>Brut</TableHead>
                <TableHead>Prime</TableHead>
                <TableHead>Retenues</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Date paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun salaire enregistré
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>
                      <Badge variant="outline">{salary.month} {salary.year}</Badge>
                    </TableCell>
                    <TableCell>{formatDisplayAmount(salary.amount)}</TableCell>
                    <TableCell className="text-primary">
                      +{formatDisplayAmount(salary.bonus || 0)}
                    </TableCell>
                    <TableCell className="text-brand-neutral">
                      -{formatDisplayAmount(salary.deductions || 0)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDisplayAmount(salary.net_amount)}
                    </TableCell>
                    <TableCell>
                      {new Date(salary.payment_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
