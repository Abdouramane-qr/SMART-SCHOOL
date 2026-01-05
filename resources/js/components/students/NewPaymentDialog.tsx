import { useState } from "react";
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
import { laravelPaiementsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { CURRENCIES, type Currency } from "@/lib/financeUtils";

const paymentSchema = z.object({
  payment_type: z.string().min(1, "Type de paiement requis"),
  amount: z.string().min(1, "Montant requis"),
  paid_amount: z.string().min(1, "Montant payé requis"),
  payment_date: z.string().min(1, "Date de paiement requise"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

interface NewPaymentDialogProps {
  student: {
    id: string;
    full_name: string;
    student_id: string;
  };
  currency?: Currency;
  isOpen: boolean;
  onClose: () => void;
}

export function NewPaymentDialog({
  student,
  currency = "XOF",
  isOpen,
  onClose,
}: NewPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currencyLabel = CURRENCIES[currency]?.symbol ?? "XOF";

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_type: "",
      amount: "",
      paid_amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      due_date: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    try {
      setIsSubmitting(true);

      const amount = parseFloat(values.amount);
      const paidAmount = parseFloat(values.paid_amount);

      // Determine payment status
      let status: "paye" | "partiel" | "en_retard" = "paye";
      if (paidAmount < amount) {
        status = "partiel";
      }
      if (values.due_date && new Date(values.due_date) < new Date() && paidAmount < amount) {
        status = "en_retard";
      }

      await laravelPaiementsApi.create({
        eleve_id: student.id,
        payment_type: values.payment_type,
        method: values.payment_type,
        amount,
        paid_amount: paidAmount,
        payment_date: values.payment_date,
        due_date: values.due_date || null,
        status,
        notes: values.notes || null,
      });

      toast.success("Paiement enregistré avec succès");
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement du paiement");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pour: {student.full_name} ({student.student_id})
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de paiement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inscription">Frais d'inscription</SelectItem>
                      <SelectItem value="scolarite">Frais de scolarité</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant total ({currencyLabel})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paid_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant payé ({currencyLabel})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de paiement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'échéance (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
      </DialogContent>
    </Dialog>
  );
}
