import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import {
  laravelGradesApi,
  laravelStudentsApi,
  laravelSubjectsApi,
  laravelClassesApi,
  laravelSchoolYearsApi,
} from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AddGradeDialogProps {
  onSuccess: () => void;
}

const terms = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export function AddGradeDialog({ onSuccess }: AddGradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
    class_id: "",
    school_year_id: "",
    term: "",
    grade: "",
  });

  const { data: studentsResponse } = useQuery({
    queryKey: ["students"],
    queryFn: laravelStudentsApi.getAll,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: laravelSubjectsApi.getAll,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: laravelClassesApi.getAll,
  });

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["school-years"],
    queryFn: laravelSchoolYearsApi.getAll,
  });

  const students = studentsResponse?.items ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.subject_id || !formData.class_id || !formData.school_year_id || !formData.term || !formData.grade) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const gradeValue = parseFloat(formData.grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast({
        title: "Erreur",
        description: "La note doit être comprise entre 0 et 20.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await laravelGradesApi.create({
        student_id: formData.student_id,
        subject_id: formData.subject_id,
        class_id: formData.class_id,
        school_year_id: formData.school_year_id,
        term: formData.term,
        grade: gradeValue,
      });

      toast({
        title: "Succès",
        description: "La note a été ajoutée avec succès.",
      });

      setFormData({
        student_id: "",
        subject_id: "",
        class_id: "",
        school_year_id: "",
        term: "",
        grade: "",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la note.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-blue">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une note</DialogTitle>
          <DialogDescription>
            Saisissez les informations de la note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student">Élève *</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData({ ...formData, student_id: value })}
              >
                <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="class">Classe *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Matière *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="school_year">Année scolaire *</Label>
                <Select
                  value={formData.school_year_id}
                  onValueChange={(value) => setFormData({ ...formData, school_year_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((year) => (
                      <SelectItem key={year.id} value={String(year.id)}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="term">Trimestre *</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value) => setFormData({ ...formData, term: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">Note /20 *</Label>
              <Input
                id="grade"
                type="number"
                step="0.5"
                min="0"
                max="20"
                placeholder="Ex: 15.5"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
