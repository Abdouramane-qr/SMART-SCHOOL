import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "./StatsCard";
import { 
  Users, 
  Award, 
  CreditCard, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Calendar,
  Mail,
  ArrowRight
} from "lucide-react";
import { laravelAuthApi } from "@/services/laravelAuthApi";
import {
  laravelAbsencesApi,
  laravelGradesApi,
  laravelStudentsApi,
  normalizeStudentClasse,
  normalizeStudentName,
} from "@/services/laravelSchoolApi";
import { Link } from "react-router-dom";

interface ParentDashboardProps {
  userId: string;
}

interface ChildSummary {
  id: string;
  name: string;
  className: string;
  average: number;
  gradesTrend: "up" | "down" | "stable";
  absencesCount: number;
  paymentStatus: "ok" | "partial" | "late";
  weakSubjects: string[];
  strongSubjects: string[];
}

export function ParentDashboard({ userId }: ParentDashboardProps) {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, [userId]);

  const fetchParentData = async () => {
    try {
      const profile = await laravelAuthApi.me();
      if (profile?.email) {
        const studentsData = await laravelStudentsApi.getByParentEmail(profile.email);
        const studentIds = studentsData.map((student) => student.id).filter(Boolean);
        const [gradesData, absencesData] = await Promise.all([
          laravelGradesApi.getByStudentIds(studentIds),
          laravelAbsencesApi.getByStudentIds(studentIds),
        ]);

        if (studentsData.length > 0) {
          let paid = 0;
          let due = 0;
          const gradesByStudent: Record<string, typeof gradesData> = {};
          gradesData.forEach((grade) => {
            if (!grade.student_id) {
              return;
            }
            if (!gradesByStudent[grade.student_id]) {
              gradesByStudent[grade.student_id] = [];
            }
            gradesByStudent[grade.student_id].push(grade);
          });

          const absencesByStudent: Record<string, typeof absencesData> = {};
          absencesData.forEach((absence) => {
            const studentId = absence.student_id ?? absence.eleve_id;
            if (!studentId) {
              return;
            }
            const key = String(studentId);
            if (!absencesByStudent[key]) {
              absencesByStudent[key] = [];
            }
            absencesByStudent[key].push(absence);
          });

          const childrenSummaries: ChildSummary[] = studentsData.map((child) => {
            const childGrades = gradesByStudent[String(child.id)] || [];
            const childPayments = child.paiements || child.payments || [];
            const childAbsences = absencesByStudent[String(child.id)] || [];

            // Calculate average
            const average = childGrades.length > 0
              ? childGrades.reduce((sum: number, g: any) => sum + g.grade, 0) / childGrades.length
              : 0;

            // Calculate payment status
            const childPaid = childPayments.reduce((sum: number, p: any) => sum + (p.paid_amount || 0), 0);
            const childDue = childPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
            paid += childPaid;
            due += childDue;

            let paymentStatus: "ok" | "partial" | "late" = "ok";
            if (childPayments.some((p: any) => p.status === "en_retard")) {
              paymentStatus = "late";
            } else if (childPayments.some((p: any) => p.status === "partiel")) {
              paymentStatus = "partial";
            }

            // Calculate grade trends by subject
            const subjectGrades: Record<string, number[]> = {};
            childGrades.forEach((g: any) => {
              const subject = g.subjects?.name || "Unknown";
              if (!subjectGrades[subject]) {
                subjectGrades[subject] = [];
              }
              subjectGrades[subject].push(g.grade);
            });

            const weakSubjects: string[] = [];
            const strongSubjects: string[] = [];
            Object.entries(subjectGrades).forEach(([subject, grades]) => {
              const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
              if (avg < 10) weakSubjects.push(subject);
              if (avg >= 14) strongSubjects.push(subject);
            });

            // Calculate overall trend
            const recentGrades = childGrades.slice(0, 5);
            const olderGrades = childGrades.slice(5, 10);
            const recentAvg = recentGrades.length > 0
              ? recentGrades.reduce((sum: number, g: any) => sum + g.grade, 0) / recentGrades.length
              : 0;
            const olderAvg = olderGrades.length > 0
              ? olderGrades.reduce((sum: number, g: any) => sum + g.grade, 0) / olderGrades.length
              : recentAvg;

            let gradesTrend: "up" | "down" | "stable" = "stable";
            if (recentAvg > olderAvg + 0.5) gradesTrend = "up";
            else if (recentAvg < olderAvg - 0.5) gradesTrend = "down";

            return {
              id: child.id,
              name: normalizeStudentName(child) || "Élève",
              className: normalizeStudentClasse(child) || "Non inscrit",
              average,
              gradesTrend,
              absencesCount: childAbsences.length,
              paymentStatus,
              weakSubjects: weakSubjects.slice(0, 3),
              strongSubjects: strongSubjects.slice(0, 3),
            };
          });

          setChildren(childrenSummaries);
          setTotalPaid(paid);
          setTotalDue(due);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingPayments = children.filter(c => c.paymentStatus !== "ok").length;
  const paymentProgress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "text-green-600";
    if (grade >= 14) return "text-blue-600";
    if (grade >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Espace Parent</h1>
          <p className="text-muted-foreground mt-1">
            Suivi de la scolarité de vos enfants
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/messages">
              <Mail className="h-4 w-4 mr-2" />
              Contacter l'école
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Nombre d'enfants"
          value={children.length.toString()}
          icon={Users}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Total payé"
          value={`${totalPaid.toLocaleString()} DH`}
          icon={CreditCard}
          trend={{ value: `sur ${totalDue.toLocaleString()} DH`, positive: totalPaid >= totalDue }}
        />
        <StatsCard
          title="Reste à payer"
          value={`${(totalDue - totalPaid).toLocaleString()} DH`}
          icon={CreditCard}
          trend={{ value: "", positive: totalPaid >= totalDue }}
        />
        <StatsCard
          title="Paiements en attente"
          value={pendingPayments.toString()}
          icon={AlertCircle}
          trend={{ value: "", positive: pendingPayments === 0 }}
        />
      </div>

      {/* Payment Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Progression des paiements</span>
            <span className="text-sm text-muted-foreground">{paymentProgress.toFixed(0)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Children Cards */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun enfant associé à votre compte
            </p>
          </CardContent>
        </Card>
      ) : (
        children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>{child.name}</span>
                  {child.gradesTrend === "up" && (
                    <Badge variant="default" className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      En progression
                    </Badge>
                  )}
                  {child.gradesTrend === "down" && (
                    <Badge variant="destructive">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      En baisse
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">{child.className}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Overview */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Moyenne générale</p>
                    <p className={`text-3xl font-bold ${getGradeColor(child.average)}`}>
                      {child.average.toFixed(2)}/20
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Absences</span>
                    <Badge variant={child.absencesCount > 5 ? "destructive" : "secondary"}>
                      {child.absencesCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Paiements</span>
                    <Badge 
                      variant={
                        child.paymentStatus === "ok" ? "default" :
                        child.paymentStatus === "partial" ? "secondary" : "destructive"
                      }
                    >
                      {child.paymentStatus === "ok" ? "À jour" :
                       child.paymentStatus === "partial" ? "Partiel" : "En retard"}
                    </Badge>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Conseils IA
                    <Badge variant="secondary" className="text-xs">Insights</Badge>
                  </h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Weak Subjects */}
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Matières à surveiller
                      </p>
                      {child.weakSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucune matière en difficulté
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {child.weakSubjects.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-orange-600 border-orange-300">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Strong Subjects */}
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Points forts
                      </p>
                      {child.strongSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Continuez les efforts
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {child.strongSubjects.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-green-600 border-green-300">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="mt-4 p-3 bg-background rounded-lg text-sm">
                    {child.average >= 14 ? (
                      <p>⭐ <strong>{child.name}</strong> montre d'excellentes performances. Encouragez-le/la à maintenir ce niveau!</p>
                    ) : child.average >= 10 ? (
                      <p>📚 <strong>{child.name}</strong> a une moyenne correcte. {child.weakSubjects.length > 0 ? `Un soutien en ${child.weakSubjects[0]} pourrait l'aider à progresser.` : "Encouragez la régularité du travail."}</p>
                    ) : (
                      <p>⚠️ <strong>{child.name}</strong> a besoin d'un accompagnement renforcé. Nous recommandons un rendez-vous avec les enseignants.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
