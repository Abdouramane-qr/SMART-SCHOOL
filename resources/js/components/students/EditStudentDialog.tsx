import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { laravelStudentsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";

const studentSchema = z.object({
  student_id: z.string().min(1, "ID élève requis").max(50),
  full_name: z.string().min(2, "Nom requis").max(100),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().max(255).optional(),
  parent_name: z.string().max(100).optional(),
  parent_phone: z.string().max(20).optional(),
  parent_email: z.string().email("Email invalide").max(255).optional().or(z.literal("")),
});

interface EditStudentDialogProps {
  student: {
    id: string;
    full_name: string;
    student_id: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStudentDialog({ student, isOpen, onClose, onSuccess }: EditStudentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      student_id: "",
      full_name: "",
      gender: "",
      date_of_birth: "",
      address: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
    },
  });

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentDetails();
    }
  }, [isOpen, student]);

  const fetchStudentDetails = async () => {
    if (!student) return;
    
    try {
      setLoading(true);
      const data = await laravelStudentsApi.getById(student.id);
      
      if (data) {
        form.reset({
          student_id: data.student_id || "",
          full_name: data.full_name || [data.first_name, data.last_name].filter(Boolean).join(" "),
          gender: data.gender || "",
          date_of_birth: data.birth_date || data.date_of_birth || "",
          address: data.address || "",
          parent_name: data.parent_name || "",
          parent_phone: data.parent_phone || "",
          parent_email: data.parent_email || "",
        });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    if (!student) return;
    
    try {
      setIsSubmitting(true);

      const splitFullName = (fullName: string) => {
        const trimmed = fullName.trim();
        if (!trimmed) return { firstName: "", lastName: "" };
        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) return { firstName: parts[0], lastName: "" };
        return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
      };

      const { firstName, lastName } = splitFullName(values.full_name);
      await laravelStudentsApi.update(student.id, {
        student_id: values.student_id,
        full_name: values.full_name,
        first_name: firstName || values.full_name,
        last_name: lastName || "",
        gender: values.gender || null,
        birth_date: values.date_of_birth || null,
        address: values.address || null,
        parent_name: values.parent_name || null,
        parent_phone: values.parent_phone || null,
        parent_email: values.parent_email || null,
      });

      toast.success("Élève mis à jour avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'élève</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Élève *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculin</SelectItem>
                          <SelectItem value="F">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Informations du parent</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parent_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du parent</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parent_email"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Email du parent</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
