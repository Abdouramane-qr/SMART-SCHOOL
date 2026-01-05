import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DollarSign, TrendingUp, TrendingDown, FileText, Calculator, Wallet, Settings, Info } from "lucide-react";
import { toast } from "sonner";
import { laravelExpensesApi, laravelFinanceApi, laravelFinanceSettingsApi, laravelPaiementsApi, type LaravelFinanceStats } from "@/services/laravelSchoolApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { generatePaymentReceipt } from "@/lib/pdfGenerator";
import { RoleGuard } from "@/components/RoleGuard";
import { useUserRole } from "@/hooks/useUserRole";
import {
  formatAmount,
  CURRENCIES,
  PAYMENT_STATUS,
  type Currency,
} from "@/lib/financeUtils";

export default function Finances() {
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [financeStats, setFinanceStats] = useState<LaravelFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("XOF");
  const [financeSettings, setFinanceSettings] = useState<Record<string, string>>({});

  const { hasRole, hasAnyRole } = useUserRole();
  const canEdit = hasAnyRole(["admin", "comptable"]);

  useEffect(() => {
    fetchFinancialData();
    fetchFinanceSettings();
  }, []);

  const fetchFinanceSettings = async () => {
    try {
      const data = await laravelFinanceSettingsApi.getAll();
      const settings: Record<string, string> = {};
      data.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });
      setFinanceSettings(settings);

      if (settings.default_currency) {
        setSelectedCurrency(settings.default_currency as Currency);
      }
    } catch (error) {
      console.error("Error fetching finance settings:", error);
    }
  };

  const fetchFinancialData = async () => {
    try {
      // Fetch finance stats
      const stats = await laravelFinanceApi.getStats();
      setFinanceStats(stats);

      // Fetch all payments
      const paymentsData = await laravelPaiementsApi.getAll();

      // Fetch all expenses
      const expensesData = await laravelExpensesApi.getAll();

      setPayments(paymentsData || []);
      setExpenses(expensesData || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données financières");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayAmount = (amount: number, currency?: Currency) => {
    return formatAmount(amount, currency || selectedCurrency);
  };

  const handleGenerateReceipt = (payment: any) => {
    try {
      generatePaymentReceipt({
        receiptNumber: payment.receipt_number || `REC-${payment.id.slice(0, 8).toUpperCase()}`,
        studentName: payment.eleve?.full_name || "N/A",
        studentId: payment.eleve?.student_id || "N/A",
        paymentType: getPaymentTypeLabel(payment.payment_type),
        amount: parseFloat(payment.amount?.toString() || "0"),
        paidAmount: parseFloat(payment.paid_amount?.toString() || "0"),
        paymentDate: payment.payment_date || new Date().toISOString(),
        notes: payment.notes,
      });
      toast.success("Reçu généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du reçu");
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      inscription: "Frais d'inscription",
      scolarite: "Frais de scolarité",
      autre: "Autre",
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config = PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS];
    if (!config) return <Badge>{status}</Badge>;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading || !financeStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultTaxRate = parseFloat(financeSettings.default_tax_rate || "18");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Comptabilité"
        description="Suivi des revenus et dépenses • Multi-devises: XOF, USD, EUR"
        icon={DollarSign}
        actions={
          <>
            <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as Currency)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Devise" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    {config.symbol} {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <RoleGuard allowedRoles={["admin"]}>
              <ActionTooltip tooltipKey="financeSettings">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </ActionTooltip>
            </RoleGuard>
          </>
        }
      />

      {/* Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Devise par défaut: {financeSettings.default_currency || "XOF"} • 
          TVA: {defaultTaxRate}% • 
          Taux USD→XOF: {financeSettings.usd_to_xof_rate || "615"} • 
          Taux EUR→XOF: {financeSettings.eur_to_xof_rate || "656"}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Encaissé"
          value={formatDisplayAmount(financeStats.totalPaid)}
          icon={DollarSign}
          trend={{ value: `sur ${formatDisplayAmount(financeStats.totalExpected)}`, positive: true }}
        />
        <StatsCard
          title="Reste à payer"
          value={formatDisplayAmount(financeStats.totalRemaining)}
          icon={Wallet}
          subtitle={`${financeStats.studentsNotUpToDate} élève(s) en retard`}
        />
        <StatsCard
          title="Dépenses"
          value={formatDisplayAmount(financeStats.totalExpenses)}
          icon={TrendingDown}
        />
        <StatsCard
          title="Résultat Net"
          value={formatDisplayAmount(financeStats.netResult)}
          icon={Calculator}
          trend={{ value: financeStats.netResult >= 0 ? "Positif" : "Négatif", positive: financeStats.netResult >= 0 }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [formatDisplayAmount(value)]}
                />
                <Bar dataKey="revenus" name="Revenus" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Tendance des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financeStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [formatDisplayAmount(value)]}
                />
                <Line
                  type="monotone"
                  dataKey="revenus"
                  name="Revenus"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tracking Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Suivi des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Montant dû</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Restant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} className="text-center text-muted-foreground">
                    Aucun paiement enregistré
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const amount = parseFloat(payment.amount?.toString() || "0");
                  const paidAmount = parseFloat(payment.paid_amount?.toString() || "0");
                  const taxAmount = parseFloat(payment.tax_amount?.toString() || "0");
                  const remaining = amount - paidAmount;
                  const currency = (payment.currency || "XOF") as Currency;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.students?.full_name || "N/A"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{currency}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(amount, currency)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatAmount(paidAmount, currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {taxAmount > 0 ? formatAmount(taxAmount, currency) : "-"}
                      </TableCell>
                      <TableCell className={remaining > 0 ? "font-medium text-red-600" : "text-muted-foreground"}>
                        {formatAmount(remaining, currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <ActionTooltip tooltipKey="generateReceipt">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateReceipt(payment)}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              Reçu
                            </Button>
                          </ActionTooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Dépenses récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Montant HT</TableHead>
                <TableHead>TVA</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune dépense enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => {
                  const amount = parseFloat(expense.amount?.toString() || "0");
                  const taxAmount = parseFloat(expense.tax_amount?.toString() || "0");
                  const currency = (expense.currency || "XOF") as Currency;
                  const totalTTC = amount + taxAmount;
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{currency}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(amount, currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {taxAmount > 0 ? formatAmount(taxAmount, currency) : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-destructive">
                        {formatAmount(totalTTC, currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
