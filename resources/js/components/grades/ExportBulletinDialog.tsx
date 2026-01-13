import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  laravelStudentsApi,
  laravelGradesApi,
  laravelClassesApi,
  laravelSubjectsApi,
  laravelSchoolYearsApi,
} from "@/services/laravelSchoolApi";
import { generateStudentBulletin } from "@/lib/bulletinPdfGenerator";
import { useToast } from "@/hooks/use-toast";

export function ExportBulletinDialog() {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: studentsResponse } = useQuery({
    queryKey: ["students"],
    queryFn: laravelStudentsApi.getAll,
  });

  const { data: grades = [] } = useQuery({
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

  const { data: currentYear } = useQuery({
    queryKey: ["currentSchoolYear"],
    queryFn: laravelSchoolYearsApi.getCurrent,
  });

  const students = studentsResponse?.items ?? [];

  const handleExport = async () => {
    if (!selectedStudent || !selectedTerm) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un élève et un trimestre",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const student = students.find((s) => String(s.id) === selectedStudent);
      if (!student) throw new Error("Élève non trouvé");

      // Filter grades for this student and term
      const studentGrades = grades.filter(
        (g: any) => g.student_id === selectedStudent && g.term === selectedTerm
      );

      if (studentGrades.length === 0) {
        toast({
          title: "Aucune note",
          description: "Aucune note trouvée pour cet élève et ce trimestre",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Get class name from first grade
      const classInfo = classes.find((c) => String(c.id) === (studentGrades[0] as any).class_id);

      // Map grades with subject info
      const gradesData = studentGrades.map((g: any) => {
        const subject = subjects.find((s) => String(s.id) === g.subject_id);
        return {
          subject_id: g.subject_id,
          subject_name: subject?.name || "Inconnue",
          coefficient: subject?.coefficient || 1,
          grade: g.grade,
          weight: g.weight || 1,
        };
      });

      generateStudentBulletin({
        studentName: student.full_name,
        studentId: student.student_id,
        className: classInfo?.name || "Inconnue",
        schoolYear: currentYear?.name || new Date().getFullYear().toString(),
        term: selectedTerm,
        grades: gradesData,
      });

      toast({
        title: "Succès",
        description: "Le bulletin a été généré avec succès",
      });

      setOpen(false);
      setSelectedStudent("");
      setSelectedTerm("");
    } catch (error) {
      console.error("Error generating bulletin:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Exporter bulletin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exporter un bulletin de notes</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student">Élève</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Sélectionner un élève" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.full_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="term">Trimestre</Label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger id="term">
                <SelectValue placeholder="Sélectionner un trimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trimestre 1">Trimestre 1</SelectItem>
                <SelectItem value="Trimestre 2">Trimestre 2</SelectItem>
                <SelectItem value="Trimestre 3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exporter PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
