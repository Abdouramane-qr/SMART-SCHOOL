import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from "lucide-react";
import { laravelGradesApi } from "@/services/laravelSchoolApi";
import { useToast } from "@/hooks/use-toast";

interface GradeWithRelations {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  school_year_id: string;
  term: string;
  grade: number;
  students?: { full_name: string; student_id: string } | null;
  subjects?: { name: string } | null;
  classes?: { name: string } | null;
}

interface EditGradeDialogProps {
  grade: GradeWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const terms = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export function EditGradeDialog({
  grade,
  open,
  onOpenChange,
  onSuccess,
}: EditGradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    term: "",
    grade: "",
  });

  useEffect(() => {
    if (grade) {
      setFormData({
        term: grade.term,
        grade: grade.grade.toString(),
      });
    }
  }, [grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) return;

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
      await laravelGradesApi.update(grade.id, {
        term: formData.term,
        grade: gradeValue,
      });

      toast({
        title: "Succès",
        description: "La note a été modifiée avec succès.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la note</DialogTitle>
          <DialogDescription>
            {grade?.students?.full_name} - {grade?.subjects?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-term">Trimestre</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-grade">Note /20</Label>
              <Input
                id="edit-grade"
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
