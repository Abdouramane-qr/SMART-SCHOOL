import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Users,
  BookOpen,
  Search,
  Edit,
  Trash2,
  UserPlus,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laravelClassesApi, laravelEnrollmentsApi } from "@/services/laravelSchoolApi";
import { AddClassDialog } from "@/components/classes/AddClassDialog";
import { EditClassDialog } from "@/components/classes/EditClassDialog";
import { DeleteClassDialog } from "@/components/classes/DeleteClassDialog";
import { ClassEnrollmentsDialog } from "@/components/classes/ClassEnrollmentsDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PageHeader } from "@/components/layout/PageHeader";
import type { LaravelClasse } from "@/services/laravelSchoolApi";

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editClass, setEditClass] = useState<LaravelClasse | null>(null);
  const [deleteClass, setDeleteClass] = useState<LaravelClasse | null>(null);
  const [enrollmentsClass, setEnrollmentsClass] = useState<LaravelClasse | null>(null);

  const {
    data: classes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["classes-with-enrollments"],
    queryFn: async () => {
      const classesData = await laravelClassesApi.getAll();
      const classesWithCount = await Promise.all(
        classesData.map(async (cls) => {
          const enrollments = await laravelEnrollmentsApi.getByClassId(cls.id);
          return { ...cls, studentsCount: enrollments.length };
        })
      );
      return classesWithCount;
    },
  });

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentsCount || 0), 0);
  const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity || 30), 0);
  const occupancyRate = totalCapacity > 0 ? ((totalStudents / totalCapacity) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Gestion des classes"
        description={`${totalClasses} classes actives`}
        icon={GraduationCap}
        actions={<AddClassDialog onSuccess={refetch} />}
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total classes"
          value={totalClasses.toString()}
          icon={BookOpen}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Élèves inscrits"
          value={totalStudents.toString()}
          icon={Users}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Capacité totale"
          value={totalCapacity.toString()}
          icon={GraduationCap}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Taux d'occupation"
          value={`${occupancyRate}%`}
          icon={Users}
          trend={{ value: "0%", positive: parseFloat(occupancyRate.toString()) < 90 }}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune classe trouvée</p>
            <div className="mt-4 inline-flex">
              <AddClassDialog onSuccess={refetch} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className="shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{classItem.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {classItem.level}
                    </Badge>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {classItem.studentsCount || 0} / {classItem.capacity || 30} élèves
                    </span>
                  </div>
                  <Badge
                    variant={
                      (classItem.studentsCount || 0) >= (classItem.capacity || 30)
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {(classItem.studentsCount || 0) >= (classItem.capacity || 30)
                      ? "Complet"
                      : "Disponible"}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((classItem.studentsCount || 0) / (classItem.capacity || 30)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEnrollmentsClass(classItem)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Inscriptions
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditClass(classItem)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteClass(classItem)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EditClassDialog
        classData={editClass}
        open={!!editClass}
        onOpenChange={(open) => !open && setEditClass(null)}
        onSuccess={refetch}
      />
      <DeleteClassDialog
        classData={deleteClass}
        open={!!deleteClass}
        onOpenChange={(open) => !open && setDeleteClass(null)}
        onSuccess={refetch}
      />
      <ClassEnrollmentsDialog
        classData={enrollmentsClass}
        open={!!enrollmentsClass}
        onOpenChange={(open) => !open && setEnrollmentsClass(null)}
      />
    </div>
  );
}
