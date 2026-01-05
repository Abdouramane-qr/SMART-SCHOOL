import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { laravelAuthApi } from "@/services/laravelAuthApi";
import { laravelUsersApi } from "@/services/laravelUsersApi";

const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Nom trop long"),
  phone: z.string().max(20, "Numéro trop long").optional().nullable(),
  address: z.string().max(255, "Adresse trop longue").optional().nullable(),
});

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { roles } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const data = await laravelAuthApi.me();
      if (!data) throw new Error("No profile data");

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const validatedData = profileSchema.parse(formData);
      setSaving(true);

      await laravelUsersApi.update(user.id, {
        full_name: validatedData.full_name,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
      });

      toast.success("Profil mis à jour avec succès");
      fetchProfile();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      } else {
        if (import.meta.env.DEV) console.error("Error updating profile:", error);
        toast.error("Erreur lors de la mise à jour du profil");
      }
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "comptable": return "default";
      case "enseignant": return "secondary";
      case "eleve": return "outline";
      case "parent": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrateur";
      case "comptable": return "Comptable";
      case "enseignant": return "Enseignant";
      case "eleve": return "Élève";
      case "parent": return "Parent";
      default: return role;
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-[26px] md:text-[28px] font-bold text-foreground">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{profile?.full_name || "Utilisateur"}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Rôles</p>
              <div className="flex flex-wrap gap-2">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Aucun rôle assigné</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Modifiez vos informations de profil ci-dessous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nom complet *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Rue de l'École, 75001 Paris"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="bg-primary">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
