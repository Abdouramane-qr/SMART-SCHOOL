import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "./StatsCard";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  UserX,
  ArrowRight
} from "lucide-react";
import {
  laravelEnrollmentsApi,
  laravelGradesApi,
  laravelTeachersApi,
  laravelTimetableApi,
} from "@/services/laravelSchoolApi";
import { Link } from "react-router-dom";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface TeacherDashboardProps {
  userId: string;
}

interface StrugglingStudent {
  id: string;
  name: string;
  average: number;
  className: string;
}

export function TeacherDashboard({ userId }: TeacherDashboardProps) {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classCount, setClassCount] = useState(0);
  const [strugglingStudents, setStrugglingStudents] = useState<StrugglingStudent[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, [userId]);

  const fetchTeacherData = async () => {
    try {
      const teacher = await laravelTeachersApi.getByUserId(userId);
      setTeacherData(teacher);

      if (teacher) {
        // Get timetable
        const scheduleData = await laravelTimetableApi.getByTeacherId(teacher.id);
        setTimetable(scheduleData || []);

        // Get unique classes
        const uniqueClasses = new Set((scheduleData || []).map((s: any) => s.class_id).filter(Boolean));
        setClassCount(uniqueClasses.size);

        // Get students in teacher's classes
        const classIds = [...uniqueClasses];
        if (classIds.length > 0) {
          const enrollmentBatches = await Promise.all(
            classIds.map((classId) => laravelEnrollmentsApi.getByClassId(classId)),
          );
          const enrollments = enrollmentBatches.flat();
          const uniqueStudentIds = Array.from(
            new Set(enrollments.map((enrollment) => enrollment.student_id).filter(Boolean)),
          );
          setTotalStudents(uniqueStudentIds.length);

          if (uniqueStudentIds.length > 0) {
            const gradesData = await laravelGradesApi.getByStudentIds(uniqueStudentIds);

            // Calculate averages per student
            const studentAverages: Record<string, { total: number; count: number }> = {};
            gradesData.forEach((grade) => {
              const studentId = grade.student_id;
              if (!studentId) {
                return;
              }
              if (!studentAverages[studentId]) {
                studentAverages[studentId] = { total: 0, count: 0 };
              }
              studentAverages[studentId].total += grade.grade;
              studentAverages[studentId].count += 1;
            });

            // Find struggling students (average < 10)
            const struggling: StrugglingStudent[] = [];
            enrollments.forEach((enrollment) => {
              const studentId = String(enrollment.student_id ?? "");
              if (!studentId) {
                return;
              }
              const avg = studentAverages[studentId];
              if (avg && avg.count > 0) {
                const average = avg.total / avg.count;
                if (average < 10) {
                  struggling.push({
                    id: studentId,
                    name: enrollment.students?.full_name || "N/A",
                    average,
                    className: enrollment.classes?.name || "N/A",
                  });
                }
              }
            });

            struggling.sort((a, b) => a.average - b.average);
            setStrugglingStudents(struggling.slice(0, 5));

            // Recent grades
            setRecentGrades(gradesData.slice(0, 5));
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching teacher data:", error);
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

  const todaySchedule = timetable.filter(
    (t) => t.day_of_week === new Date().getDay()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">
            Bienvenue, {teacherData?.profiles?.full_name || "Enseignant"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Votre tableau de bord personnalisé
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/grades">
              <ClipboardList className="h-4 w-4 mr-2" />
              Saisir notes
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/absences">
              <UserX className="h-4 w-4 mr-2" />
              Absences
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Cours cette semaine"
          value={timetable.length.toString()}
          icon={BookOpen}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Classes enseignées"
          value={classCount.toString()}
          icon={Users}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Élèves suivis"
          value={totalStudents.toString()}
          icon={Users}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Cours aujourd'hui"
          value={todaySchedule.length.toString()}
          icon={Calendar}
          trend={{ value: "", positive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Insights - Struggling Students */}
        <Card className="border-brand-neutral">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5" />
              Élèves en difficulté
              <Badge variant="secondary" className="ml-auto">
                IA Insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strugglingStudents.length === 0 ? (
              <div className="text-center py-6">
                <TrendingUp className="h-10 w-10 mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">
                  Tous vos élèves ont une moyenne supérieure à 10
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {strugglingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background"
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.className}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {student.average.toFixed(1)}/20
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.average < 8 ? "Critique" : "À surveiller"}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  💡 Suggestion: Planifiez des séances de soutien pour ces élèves
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
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
                        {item.classes?.name} • {item.classrooms?.name || "Salle non assignée"}
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
      </div>

      {/* Week Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Emploi du temps de la semaine</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/timetable">
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((day) => {
              const daySchedule = timetable.filter((t) => t.day_of_week === day);
              const isToday = new Date().getDay() === day;
              return (
                <div 
                  key={day} 
                  className={`border rounded-lg p-3 ${isToday ? 'border-primary bg-primary/5' : ''}`}
                >
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {DAYS[day]}
                    {isToday && <Badge variant="default" className="text-xs">Aujourd'hui</Badge>}
                  </h4>
                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Pas de cours</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm p-2 bg-primary/10 rounded"
                        >
                          <p className="font-medium">{item.subjects?.name}</p>
                          <p className="text-muted-foreground">
                            {item.start_time} - {item.end_time}
                          </p>
                          <p className="text-muted-foreground">{item.classes?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
