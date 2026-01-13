import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  laravelStudentsApi,
  normalizeStudentClasse,
  normalizeStudentName,
  normalizeStudentPayments,
} from "@/services/laravelSchoolApi";
import { formatAmount, type Currency } from "@/lib/financeUtils";

interface StudentDetailsModalProps {
  student: {
    id: string;
    full_name: string;
    student_id: string;
    class_name: string | null;
    first_name?: string | null;
    last_name?: string | null;
    gender?: string | null;
    birth_date?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    parent_name?: string | null;
    parent_phone?: string | null;
    parent_email?: string | null;
  };
  currency?: Currency;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({
  student,
  currency = "XOF",
  isOpen,
  onClose,
}: StudentDetailsModalProps) {
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveApiError = (err: unknown) => {
    if (err && typeof err === "object") {
      const status = (err as { status?: number }).status;
      const code = (err as { code?: string }).code;
      if (status === 409 || code === "active_school_missing") {
        return "Aucune école active n'est définie. Activez une école pour continuer.";
      }
      if (status === 403) {
        if (code === "school_mismatch") {
          return "Cet élève n'appartient pas à l'école active.";
        }
        return "Accès refusé. Vos permissions ne permettent pas d'accéder à cette fiche.";
      }
      if ((err as { message?: string }).message) {
        return (err as { message: string }).message;
      }
    }
    return "Impossible de charger la fiche élève.";
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudentDetails();
    }
  }, [isOpen, student.id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentData = await laravelStudentsApi.getById(student.id);
      const { payments: studentPayments } = normalizeStudentPayments(studentData);

      setStudentDetails(studentData);
      setPayments(studentPayments || []);
    } catch (err: unknown) {
      const message = resolveApiError(err);
      toast.error(message);
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") {
      return "Non renseigné";
    }
    return String(value);
  };

  const displayDate = (value?: string | null) => {
    if (!value) {
      return "Non renseigné";
    }
    return new Date(value).toLocaleDateString("fr-FR");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
      paye: { label: "Payé", variant: "success" },
      en_retard: { label: "En retard", variant: "destructive" },
      partiel: { label: "Partiellement payé", variant: "warning" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const resolvedStudent = studentDetails ? { ...student, ...studentDetails } : student;
  const resolvedClass =
    studentDetails != null
      ? normalizeStudentClasse(studentDetails || {})
      : student.class_name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'élève</DialogTitle>
          <DialogDescription>Informations personnelles, parentales et financières.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-neutral"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <button
              type="button"
              className="mt-4 text-sm text-primary underline"
              onClick={fetchStudentDetails}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID Élève</p>
                <p className="font-medium">{displayValue(resolvedStudent?.student_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">
                  {displayValue(normalizeStudentName(resolvedStudent || {}) || student.full_name)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classe</p>
                <p className="font-medium">{resolvedClass || "Non assigné"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {displayDate(resolvedStudent?.birth_date || resolvedStudent?.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="font-medium">{displayValue(resolvedStudent?.gender)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{displayValue(resolvedStudent?.address)}</p>
              </div>
            </div>

            <Separator />

            {/* Parent Information */}
            <div>
              <h3 className="font-semibold mb-3">Informations parent</h3>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom du parent</p>
                <p className="font-medium">{displayValue(resolvedStudent?.parent_name)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{displayValue(resolvedStudent?.parent_phone)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{displayValue(resolvedStudent?.parent_email)}</p>
              </div>
            </div>
          </div>

            <Separator />

            {/* Payment History */}
            <div>
              <h3 className="font-semibold mb-3">Historique des paiements</h3>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun paiement enregistré
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant dû</TableHead>
                      <TableHead>Montant payé</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString("fr-FR")
                            : "Non renseigné"}
                        </TableCell>
                        <TableCell>{payment.payment_type || payment.method || "Non renseigné"}</TableCell>
                        <TableCell>{formatAmount(Number(payment.amount || 0), currency)}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatAmount(Number(payment.paid_amount ?? payment.amount ?? 0), currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
