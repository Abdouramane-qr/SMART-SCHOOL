import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "./StatsCard";
import { 
  BookOpen, 
  Award, 
  CreditCard, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Clock,
  Target,
  ArrowRight
} from "lucide-react";
import {
  laravelAbsencesApi,
  laravelGradesApi,
  laravelPaiementsApi,
  laravelStudentsApi,
  laravelTimetableApi,
  normalizeStudentClasse,
  normalizeStudentName,
} from "@/services/laravelSchoolApi";
import { Link } from "react-router-dom";
import { formatAmount, type Currency } from "@/lib/financeUtils";
import { useFinanceCurrency } from "@/hooks/useFinanceCurrency";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface StudentDashboardProps {
  userId: string;
}

interface GradeWithTrend {
  subject: string;
  grade: number;
  trend: "up" | "down" | "stable";
  previousGrade?: number;
}

export function StudentDashboard({ userId }: StudentDashboardProps) {
  const [studentData, setStudentData] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<GradeWithTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const { defaultCurrency } = useFinanceCurrency();

  useEffect(() => {
    fetchStudentData();
  }, [userId]);

  const fetchStudentData = async () => {
    try {
      const student = await laravelStudentsApi.getByUserId(userId);
      setStudentData(student);

      if (student) {
        const [gradesData, paymentsData, absencesData] = await Promise.all([
          laravelGradesApi.getByStudentId(student.id),
          laravelPaiementsApi.getByStudentId(student.id),
          laravelAbsencesApi.getByStudentId(student.id),
        ]);

        setGrades(gradesData || []);

        // Calculate subject statistics with trends
        if (gradesData && gradesData.length > 0) {
          const subjectGrades: Record<string, number[]> = {};
          gradesData.forEach(g => {
            const subject = g.subjects?.name || "Unknown";
            if (!subjectGrades[subject]) {
              subjectGrades[subject] = [];
            }
            subjectGrades[subject].push(g.grade);
          });

          const stats: GradeWithTrend[] = Object.entries(subjectGrades).map(([subject, grades]) => {
            const latest = grades[0];
            const previous = grades[1];
            let trend: "up" | "down" | "stable" = "stable";
            if (previous !== undefined) {
              if (latest > previous) trend = "up";
              else if (latest < previous) trend = "down";
            }
            return { subject, grade: latest, trend, previousGrade: previous };
          });

          stats.sort((a, b) => a.grade - b.grade);
          setSubjectStats(stats);
        }

        setPayments(paymentsData || []);

        setAbsences(absencesData || []);

        // Get timetable for student's class
        const classId = student.classe?.id ?? student.class?.id ?? student.classe_id;
        if (classId) {
          const scheduleData = await laravelTimetableApi.getByClassId(classId);
          setTimetable(scheduleData || []);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-neutral"></div>
      </div>
    );
  }

  // Calculate stats
  const totalGrades = grades.length;
  const average = totalGrades > 0
    ? grades.reduce((sum, g) => sum + g.grade, 0) / totalGrades
    : 0;

  const totalPaid = payments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentProgress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  const todaySchedule = timetable.filter(
    (t) => t.day_of_week === new Date().getDay()
  );

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "text-primary";
    if (grade >= 14) return "text-foreground";
    if (grade >= 10) return "text-brand-neutral";
    return "text-brand-neutral";
  };

  const getGradeBg = (grade: number) => {
    if (grade >= 16) return "bg-primary/10";
    if (grade >= 14) return "bg-surface";
    if (grade >= 10) return "bg-background";
    return "bg-background";
  };

  // Identify weak subjects
  const weakSubjects = subjectStats.filter(s => s.grade < 10);
  const strongSubjects = subjectStats.filter(s => s.grade >= 14);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">
            Bienvenue, {studentData ? normalizeStudentName(studentData) || "Élève" : "Élève"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {studentData ? normalizeStudentClasse(studentData) || "Classe non assignée" : "Classe non assignée"}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/messages">
              Contacter un enseignant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Moyenne générale"
          value={`${average.toFixed(2)}/20`}
          icon={Award}
          trend={{ value: average >= 10 ? "Validé" : "À améliorer", positive: average >= 10 }}
        />
        <StatsCard
          title="Nombre de notes"
          value={totalGrades.toString()}
          icon={BookOpen}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Absences"
          value={absences.length.toString()}
          icon={Calendar}
          subtitle={`${absences.filter(a => a.justified).length} justifiées`}
        />
        <StatsCard
          title="Cours aujourd'hui"
          value={todaySchedule.length.toString()}
          icon={Clock}
          trend={{ value: "", positive: true }}
        />
      </div>

      {/* AI Insights Panel */}
      <Card className="border-brand-neutral bg-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Conseils personnalisés
            <Badge variant="secondary" className="ml-auto">IA Insights</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Weak Subjects */}
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                Matières à renforcer
              </h4>
              {weakSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bravo! Toutes vos matières sont au-dessus de la moyenne.
                </p>
              ) : (
                <div className="space-y-2">
                  {weakSubjects.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{s.subject}</span>
                      <span className={getGradeColor(s.grade)}>{s.grade.toFixed(1)}/20</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Consacrez plus de temps à ces matières cette semaine
                  </p>
                </div>
              )}
            </div>

            {/* Strong Subjects */}
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" />
                Points forts
              </h4>
              {strongSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Continuez vos efforts pour atteindre l'excellence!
                </p>
              ) : (
                <div className="space-y-2">
                  {strongSubjects.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{s.subject}</span>
                      <span className={getGradeColor(s.grade)}>{s.grade.toFixed(1)}/20</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    ⭐ Excellentes performances, maintenez ce niveau!
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Emploi du temps du jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Pas de cours prévu aujourd'hui
              </p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{item.subjects?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.teachers?.profiles?.full_name || "N/A"}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {item.start_time} - {item.end_time}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades with Trends */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Dernières notes
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/grades">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune note enregistrée
              </p>
            ) : (
              <div className="space-y-3">
                {grades.slice(0, 5).map((grade) => {
                  const stat = subjectStats.find(s => s.subject === grade.subjects?.name);
                  return (
                    <div
                      key={grade.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${getGradeBg(grade.grade)}`}
                    >
                      <div className="flex items-center gap-2">
                        {stat?.trend === "up" && <TrendingUp className="h-4 w-4 text-primary" />}
                        {stat?.trend === "down" && <TrendingDown className="h-4 w-4 text-brand-neutral" />}
                        <div>
                          <p className="font-medium">{grade.subjects?.name}</p>
                          <p className="text-sm text-muted-foreground">{grade.term}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>
                        {grade.grade.toFixed(1)}/20
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status with Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            État des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progression</span>
              <span className="text-sm font-medium">{paymentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span>Payé: {formatAmount(totalPaid, defaultCurrency as Currency)}</span>
              <span>Total: {formatAmount(totalDue, defaultCurrency as Currency)}</span>
            </div>
          </div>
          
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun paiement enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium capitalize">{payment.payment_type}</p>
                    <p className="text-sm text-muted-foreground">
                      Dû: {formatAmount(Number(payment.amount || 0), defaultCurrency as Currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatAmount(Number(payment.paid_amount || 0), defaultCurrency as Currency)}
                    </p>
                    <Badge
                      variant={
                        payment.status === "paye"
                          ? "success"
                          : payment.status === "partiel"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {payment.status === "paye"
                        ? "Payé"
                        : payment.status === "partiel"
                        ? "Partiel"
                        : "En retard"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
