import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Users,
  DollarSign,
  TrendingDown,
  Calculator,
  CreditCard,
  FileText,
  GraduationCap,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Wallet,
  UserPlus,
  School,
  ClipboardList,
  UserX,
  Mail,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { exportDashboardToPDF, exportDashboardToExcel } from "@/lib/dashboardExport";
import { toastApiError } from "@/lib/errorToast";
import {
  laravelDashboardApi,
  laravelExpensesApi,
  laravelFinanceApi,
  laravelFinanceSettingsApi,
  laravelPaiementsApi,
  laravelSchoolYearsApi,
  type LaravelFinanceStats,
} from "@/services/laravelSchoolApi";
import { formatAmount as formatCurrency, type Currency, CURRENCIES, PAYMENT_STATUS } from "@/lib/financeUtils";
import { getStatusSoftClass, getStatusTextClass } from "@/lib/statusMap";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface RecentActivity {
  id: string;
  type: "payment" | "student" | "expense";
  title: string;
  description: string;
  date: string;
  icon: typeof CreditCard;
  amount?: number;
  currency?: Currency;
  status?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { roles } = useUserRole();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [financeStats, setFinanceStats] = useState<LaravelFinanceStats | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("XOF");
  const [paymentDistribution, setPaymentDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setUserRole(roles[0] || "admin");
    }
  }, [roles, user]);

  useEffect(() => {
    if (userRole === "admin" || userRole === "comptable" || userRole === null) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      const [
        stats,
        schoolYearData,
        summary,
        paymentsData,
        expensesData,
        settingsData,
      ] = await Promise.all([
        laravelFinanceApi.getStats(),
        laravelSchoolYearsApi.getCurrent(),
        laravelDashboardApi.getSummary(),
        laravelPaiementsApi.getAll(),
        laravelExpensesApi.getAll(),
        laravelFinanceSettingsApi.getAll(),
      ]);

      setFinanceStats(stats);
      setSchoolYear(schoolYearData?.name || "2024-2025");
      setTotalStudents(summary.total_eleves || 0);

      const settings: Record<string, string> = {};
      (settingsData || []).forEach((setting) => {
        settings[setting.setting_key] = setting.setting_value;
      });
      const defaultCurrency =
        settings.default_currency && CURRENCIES[settings.default_currency as Currency]
          ? (settings.default_currency as Currency)
          : "XOF";
      setSelectedCurrency(defaultCurrency);

      // Payment distribution for donut chart
      const paidCount = (paymentsData || []).filter(p => p.status === "paye").length;
      const partialCount = (paymentsData || []).filter(p => p.status === "partiel").length;
      const unpaidCount = (paymentsData || []).filter(p => p.status === "en_retard").length;

      setPaymentDistribution([
        { name: "Payé", value: paidCount, color: "hsl(142, 76%, 36%)" },
        { name: "Partiel", value: partialCount, color: "hsl(38, 92%, 50%)" },
        { name: "Non payé", value: unpaidCount, color: "hsl(0, 84%, 60%)" },
      ]);

      // Recent activities
      const activities: RecentActivity[] = [];

      (paymentsData || []).slice(0, 3).forEach(payment => {
        const paymentAmount = parseFloat((payment.paid_amount ?? payment.amount)?.toString() || "0");
        const currency = (payment.currency || defaultCurrency) as Currency;
        activities.push({
          id: payment.id,
          type: "payment",
          title: "Nouveau paiement",
          description: `${payment.eleve?.full_name || "N/A"}`,
          date: payment.payment_date || new Date().toISOString(),
          icon: CreditCard,
          amount: paymentAmount,
          currency,
          status: payment.status || "paye",
        });
      });

      (expensesData || []).slice(0, 2).forEach(expense => {
        const expenseAmount = parseFloat(expense.amount?.toString() || "0");
        activities.push({
          id: expense.id,
          type: "expense",
          title: "Dépense enregistrée",
          description: expense.category || "Dépense",
          date: expense.expense_date,
          icon: TrendingDown,
          amount: expenseAmount,
          currency: defaultCurrency,
          status: "depense",
        });
      });

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      if (import.meta.env.DEV) console.error("Dashboard data error:", error);
      toastApiError(error, { fallback: "Erreur lors du chargement des statistiques" });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: Currency = selectedCurrency) => {
    return formatCurrency(amount, currency);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    if (status === "depense") {
      return <Badge variant="secondary">Dépense</Badge>;
    }
    const config = PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleExportPDF = () => {
    if (!financeStats) return;
    try {
      exportDashboardToPDF({
        schoolYear,
        stats: {
          totalStudents,
          totalRevenue: financeStats.totalPaid,
          totalExpenses: financeStats.totalExpenses + financeStats.totalSalaries,
          netResult: financeStats.netResult,
        },
        paymentDistribution: paymentDistribution.map(p => ({ name: p.name, value: p.value })),
        monthlyPayments: financeStats.monthlyData.map(d => ({ month: d.month, montant: d.revenus })),
        exportDate: new Date().toLocaleDateString("fr-FR"),
        currency: selectedCurrency,
      });
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleExportExcel = () => {
    if (!financeStats) return;
    try {
      exportDashboardToExcel({
        schoolYear,
        stats: {
          totalStudents,
          totalRevenue: financeStats.totalPaid,
          totalExpenses: financeStats.totalExpenses + financeStats.totalSalaries,
          netResult: financeStats.netResult,
        },
        paymentDistribution: paymentDistribution.map(p => ({ name: p.name, value: p.value })),
        monthlyPayments: financeStats.monthlyData.map(d => ({ month: d.month, montant: d.revenus })),
        exportDate: new Date().toLocaleDateString("fr-FR"),
        currency: selectedCurrency,
      });
      toast.success("Rapport Excel généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du fichier Excel");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Role-based dashboards
  if (user && userRole === "enseignant") {
    return <TeacherDashboard userId={user.id} />;
  }

  if (user && userRole === "eleve") {
    return <StudentDashboard userId={user.id} />;
  }

  if (user && userRole === "parent") {
    return <ParentDashboard userId={user.id} />;
  }

  // Admin/Comptable dashboard
  if (!financeStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Impossible de charger les données</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Dashboard Administratif"
        description="Vue d'ensemble de votre établissement"
        icon={GraduationCap}
        actions={
          <>
            <div className="flex items-center gap-3 px-4 py-2 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Année:</span>
                <span className="font-semibold text-secondary-foreground">{schoolYear}</span>
                <ActionTooltip tooltipKey="dashboardSchoolYear">
                  <span className="inline-flex items-center">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </ActionTooltip>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Devise:</span>
                <span className="font-semibold text-secondary-foreground">
                  {selectedCurrency}
                </span>
                <ActionTooltip tooltipKey="dashboardCurrency">
                  <span className="inline-flex items-center">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </ActionTooltip>
              </div>
            </div>
            <ActionTooltip tooltipKey="exportPDF">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </ActionTooltip>
            <ActionTooltip tooltipKey="exportExcel">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </ActionTooltip>
          </>
        }
      />

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Élèves"
          value={totalStudents.toString()}
          icon={Users}
          subtitle={`${financeStats.studentsUpToDate} à jour`}
        />
        <StatsCard
          title="Total Encaissé"
          value={formatAmount(financeStats.totalPaid)}
          icon={DollarSign}
          trend={{ value: `sur ${formatAmount(financeStats.totalExpected)}`, positive: true }}
        />
        <StatsCard
          title="Dépenses Totales"
          value={formatAmount(financeStats.totalExpenses + financeStats.totalSalaries)}
          icon={TrendingDown}
          subtitle={`Salaires: ${formatAmount(financeStats.totalSalaries)}`}
        />
        <StatsCard
          title="Résultat Net"
          value={formatAmount(financeStats.netResult)}
          icon={Calculator}
          trend={{ value: financeStats.netResult >= 0 ? "Positif" : "Négatif", positive: financeStats.netResult >= 0 }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-primary" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ActionTooltip tooltipKey="quickAddStudent">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/students">
                <UserPlus className="mr-2 h-4 w-4" />
                Élève
              </Link>
            </Button>
          </ActionTooltip>
          <ActionTooltip tooltipKey="quickAddClass">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/classes">
                <School className="mr-2 h-4 w-4" />
                Classe
              </Link>
            </Button>
          </ActionTooltip>
          <ActionTooltip tooltipKey="quickAddGrade">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/grades">
                <ClipboardList className="mr-2 h-4 w-4" />
                Note
              </Link>
            </Button>
          </ActionTooltip>
          <ActionTooltip tooltipKey="quickAddAbsence">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/absences">
                <UserX className="mr-2 h-4 w-4" />
                Absence
              </Link>
            </Button>
          </ActionTooltip>
          <ActionTooltip tooltipKey="quickMessage">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/messages">
                <Mail className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>
          </ActionTooltip>
        </CardContent>
      </Card>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getStatusSoftClass("success")}`}>
                <CheckCircle className={`h-5 w-5 ${getStatusTextClass("success")}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Élèves à jour</p>
                <p className="text-2xl font-bold">{financeStats.studentsUpToDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-neutral/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-brand-neutral" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Élèves en retard</p>
                <p className="text-2xl font-bold">{financeStats.studentsNotUpToDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getStatusSoftClass("warning")}`}>
                <Wallet className={`h-5 w-5 ${getStatusTextClass("warning")}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reste à payer</p>
                <p className={`text-2xl font-bold ${getStatusTextClass("warning")}`}>
                  {formatAmount(financeStats.totalRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getStatusSoftClass("info")}`}>
                <DollarSign className={`h-5 w-5 ${getStatusTextClass("info")}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Masse salariale</p>
                <p className="text-2xl font-bold">{formatAmount(financeStats.totalSalaries)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart - Monthly Revenue vs Expenses */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Revenus vs Dépenses par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [formatAmount(value)]}
                />
                <Bar dataKey="revenus" name="Revenus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart - Payment Distribution */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Répartition des paiements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Évolution des revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={financeStats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [formatAmount(value), "Montant"]}
              />
              <Line
                type="monotone"
                dataKey="revenus"
                name="Revenus"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tableau de suivi
            <ActionTooltip tooltipKey="dashboardSummaryTable">
              <span className="inline-flex items-center">
                <Info className="h-4 w-4 text-muted-foreground" />
              </span>
            </ActionTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Année</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune activité récente
                  </TableCell>
                </TableRow>
              ) : (
                recentActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  const rowCurrency = activity.currency || selectedCurrency;
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              activity.type === "payment"
                                ? getStatusSoftClass("success")
                                : activity.type === "expense"
                                  ? getStatusSoftClass("neutral")
                                  : getStatusSoftClass("info")
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{activity.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{activity.description}</TableCell>
                      <TableCell className="font-semibold">
                        {activity.amount !== undefined ? formatAmount(activity.amount, rowCurrency) : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{schoolYear}</TableCell>
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
