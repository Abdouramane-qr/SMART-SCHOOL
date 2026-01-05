import { useState } from "react";
import { laravelUsersApi } from "@/services/laravelUsersApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "comptable" | "enseignant" | "eleve" | "parent";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "comptable", label: "Comptable" },
  { value: "enseignant", label: "Enseignant" },
  { value: "eleve", label: "Élève" },
  { value: "parent", label: "Parent" },
];

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    roles: [] as AppRole[],
  });

  const handleRoleToggle = (role: AppRole) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password || !formData.full_name.trim()) {
      toast({
        title: "Erreur",
        description: "Email, mot de passe et nom complet sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await laravelUsersApi.create({
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        roles: formData.roles.length ? formData.roles : undefined,
      });

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès.",
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        roles: [],
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel Utilisateur</DialogTitle>
          <DialogDescription>
            Créer un nouveau compte utilisateur dans le système
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean.dupont@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+221 77 123 45 67"
            />
          </div>

          <div className="space-y-2">
            <Label>Rôles</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${option.value}`}
                    checked={formData.roles.includes(option.value)}
                    onCheckedChange={() => handleRoleToggle(option.value)}
                  />
                  <Label
                    htmlFor={`role-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
