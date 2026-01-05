import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
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

  useEffect(() => {
    if (isOpen) {
      fetchStudentDetails();
    }
  }, [isOpen, student.id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const studentData = await laravelStudentsApi.getById(student.id);
      const { payments: studentPayments } = normalizeStudentPayments(studentData);

      setStudentDetails(studentData);
      setPayments(studentPayments || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des détails");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      paye: { label: "Payé", variant: "default" },
      en_retard: { label: "En retard", variant: "destructive" },
      partiel: { label: "Partiellement payé", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'élève</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID Élève</p>
                <p className="font-medium">{studentDetails?.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">{normalizeStudentName(studentDetails || {})}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classe</p>
                <p className="font-medium">{normalizeStudentClasse(studentDetails || {}) || "Non assigné"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {studentDetails?.birth_date || studentDetails?.date_of_birth
                    ? new Date(studentDetails?.birth_date || studentDetails?.date_of_birth).toLocaleDateString("fr-FR")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="font-medium">{studentDetails?.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{studentDetails?.address || "N/A"}</p>
              </div>
            </div>

            <Separator />

            {/* Parent Information */}
            <div>
              <h3 className="font-semibold mb-3">Informations parent</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                <p className="text-sm text-muted-foreground">Nom du parent</p>
                <p className="font-medium">{studentDetails?.parent_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{studentDetails?.parent_phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{studentDetails?.parent_email || "N/A"}</p>
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
                            : "N/A"}
                        </TableCell>
                        <TableCell>{payment.payment_type || payment.method || "N/A"}</TableCell>
                        <TableCell>{formatAmount(Number(payment.amount || 0), currency)}</TableCell>
                        <TableCell className="font-medium text-green-600">
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
