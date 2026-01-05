import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  Calculator,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laravelGradesApi, laravelClassesApi, laravelSubjectsApi } from "@/services/laravelSchoolApi";
import { AddGradeDialog } from "@/components/grades/AddGradeDialog";
import { EditGradeDialog } from "@/components/grades/EditGradeDialog";
import { DeleteGradeDialog } from "@/components/grades/DeleteGradeDialog";
import { ExportBulletinDialog } from "@/components/grades/ExportBulletinDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RoleGuard } from "@/components/RoleGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { 
  calculateWeightedAverage, 
  calculateGradeStats, 
  getAppreciation,
  GRADE_TYPES,
  TERMS,
} from "@/lib/gradeCalculations";

interface GradeWithRelations {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  school_year_id: string;
  term: string;
  grade: number;
  grade_type?: string;
  weight?: number;
  description?: string;
  evaluation_date?: string;
  created_at: string;
  students?: { full_name: string; student_id: string } | null;
  subjects?: { name: string; coefficient: number | null } | null;
  classes?: { name: string } | null;
}

export default function Grades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTerm, setFilterTerm] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [editGrade, setEditGrade] = useState<GradeWithRelations | null>(null);
  const [deleteGrade, setDeleteGrade] = useState<GradeWithRelations | null>(null);

  const { hasRole, hasAnyRole } = useUserRole();
  const canEdit = hasAnyRole(["admin", "enseignant"]);

  const {
    data: grades = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["grades"],
    queryFn: laravelGradesApi.getAll,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: laravelClassesApi.getAll,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: laravelSubjectsApi.getAll,
  });

  const filteredGrades = (grades as GradeWithRelations[]).filter((grade) => {
    const matchesSearch =
      grade.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "all" || grade.class_id === filterClass;
    const matchesSubject = filterSubject === "all" || grade.subject_id === filterSubject;
    const matchesTerm = filterTerm === "all" || grade.term === filterTerm;
    const matchesType = filterType === "all" || grade.grade_type === filterType;

    return matchesSearch && matchesClass && matchesSubject && matchesTerm && matchesType;
  });

  // Calculate statistics with weights
  const gradeValues = filteredGrades.map(g => g.grade);
  const stats = calculateGradeStats(gradeValues);
  
  // Calculate weighted average
  const weightedAvg = calculateWeightedAverage(
    filteredGrades.map(g => ({ grade: g.grade, weight: g.weight || 1 }))
  );

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "text-green-600 dark:text-green-400";
    if (grade >= 14) return "text-blue-600 dark:text-blue-400";
    if (grade >= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-destructive";
  };

  const getGradeBadge = (grade: number) => {
    const { label, variant } = getAppreciation(grade);
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string | undefined) => {
    const typeConfig = GRADE_TYPES[type as keyof typeof GRADE_TYPES] || GRADE_TYPES.devoir;
    return (
      <Badge variant="outline" className="text-xs">
        {typeConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des notes</h1>
          <p className="text-muted-foreground mt-1">
            {filteredGrades.length} notes • Types: Devoir, Composition, Interrogation, Projet
          </p>
        </div>
        <div className="flex gap-2">
          <ActionTooltip tooltipKey="exportBulletin">
            <div><ExportBulletinDialog /></div>
          </ActionTooltip>
          <RoleGuard allowedRoles={["admin", "enseignant"]}>
            <ActionTooltip tooltipKey="addGrade">
              <div><AddGradeDialog onSuccess={refetch} /></div>
            </ActionTooltip>
          </RoleGuard>
        </div>
      </div>

      {/* Info Banner for read-only users */}
      <RoleGuard allowedRoles={["eleve", "parent"]}>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Mode consultation uniquement. Vous pouvez voir vos notes mais pas les modifier.
          </span>
        </div>
      </RoleGuard>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatsCard
          title="Total notes"
          value={filteredGrades.length.toString()}
          icon={BookOpen}
        />
        <StatsCard
          title="Moyenne pondérée"
          value={`${weightedAvg.toFixed(2)}/20`}
          icon={Calculator}
          trend={{ value: weightedAvg >= 10 ? "Positif" : "À améliorer", positive: weightedAvg >= 10 }}
        />
        <StatsCard
          title="Moyenne simple"
          value={`${stats.average.toFixed(2)}/20`}
          icon={Award}
        />
        <StatsCard
          title="Au-dessus de 10"
          value={stats.aboveAverage.toString()}
          icon={TrendingUp}
          trend={{ value: `${((stats.aboveAverage / Math.max(1, gradeValues.length)) * 100).toFixed(0)}%`, positive: true }}
        />
        <StatsCard
          title="En-dessous de 10"
          value={stats.belowAverage.toString()}
          icon={TrendingDown}
          trend={{ value: `${((stats.belowAverage / Math.max(1, gradeValues.length)) * 100).toFixed(0)}%`, positive: false }}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Matière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(GRADE_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune note trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                  <TableHead className="text-center">Poids</TableHead>
                  <TableHead>Appréciation</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{grade.students?.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {grade.students?.student_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{grade.classes?.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{grade.subjects?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Coef. {grade.subjects?.coefficient || 1}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(grade.grade_type)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{grade.term}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>
                        {grade.grade.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-sm">/20</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-muted-foreground">
                        ×{(grade.weight || 1).toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>{getGradeBadge(grade.grade)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditGrade(grade)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteGrade(grade)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - Only for users with edit permission */}
      {canEdit && (
        <>
          <EditGradeDialog
            grade={editGrade}
            open={!!editGrade}
            onOpenChange={(open) => !open && setEditGrade(null)}
            onSuccess={refetch}
          />
          <DeleteGradeDialog
            grade={deleteGrade}
            open={!!deleteGrade}
            onOpenChange={(open) => !open && setDeleteGrade(null)}
            onSuccess={refetch}
          />
        </>
      )}
    </div>
  );
}
