import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { laravelEnrollmentsApi, laravelSchoolYearsApi, laravelStudentsApi, type LaravelClasse, type LaravelEleve } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClassEnrollmentsDialogProps {
  classData: LaravelClasse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassEnrollmentsDialog({
  classData,
  open,
  onOpenChange,
}: ClassEnrollmentsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ["enrollments", classData?.id],
    queryFn: () => (classData ? laravelEnrollmentsApi.getByClassId(classData.id) : Promise.resolve([])),
    enabled: !!classData && open,
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await laravelStudentsApi.getAll();
      return response.items;
    },
    enabled: open,
  });

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["school-years"],
    queryFn: laravelSchoolYearsApi.getAll,
    enabled: open,
  });

  const enrolledStudentIds = enrollments.map((e: any) => e.student_id);
  const availableStudents = allStudents.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  ) as LaravelEleve[];

  const handleAddEnrollment = async () => {
    if (!classData || !selectedStudent || !selectedSchoolYear) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un élève et une année scolaire.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await laravelEnrollmentsApi.create({
        class_id: classData.id,
        student_id: Number(selectedStudent),
        school_year_id: Number(selectedSchoolYear),
      });

      toast({
        title: "Succès",
        description: "L'élève a été inscrit à la classe.",
      });

      setSelectedStudent("");
      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ["classes-with-enrollments"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    setLoading(true);
    try {
      await laravelEnrollmentsApi.delete(enrollmentId);

      toast({
        title: "Succès",
        description: "L'élève a été retiré de la classe.",
      });

      refetchEnrollments();
      queryClient.invalidateQueries({ queryKey: ["classes-with-enrollments"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inscriptions - {classData?.name}
          </DialogTitle>
          <DialogDescription>
            Gérez les élèves inscrits dans cette classe.
            <br />
            <Badge variant="outline" className="mt-2">
              {enrollments.length} / {classData?.capacity || 30} élèves
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add enrollment form */}
          <div className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-muted/50">
            <Label className="font-medium">Inscrire un élève</Label>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="flex-1 min-w-[180px]">
                  <SelectValue placeholder="Sélectionner un élève" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                <SelectTrigger className="flex-1 min-w-[140px]">
                  <SelectValue placeholder="Année scolaire" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddEnrollment} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Enrollments list */}
          {enrollments.length > 0 ? (
            <div className="border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-mono text-sm">
                        {enrollment.students?.student_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {enrollment.students?.full_name}
                      </TableCell>
                      <TableCell>
                        {enrollment.enrollment_date
                          ? format(new Date(enrollment.enrollment_date), "dd MMM yyyy", {
                              locale: fr,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEnrollment(enrollment.id)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun élève inscrit dans cette classe.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
