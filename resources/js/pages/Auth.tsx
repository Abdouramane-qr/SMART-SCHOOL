import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { laravelAuthApi } from "@/services/laravelAuthApi";
import { useAuthContext } from "@/contexts/AuthContext";
import { toastApiError } from "@/lib/errorToast";

const authSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
  fullName: z.string().min(2, { message: "Le nom complet est requis" }).optional(),
});

export default function Auth() {
  const navigate = useNavigate();
  const { refreshSession } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    // Check if already logged in
    laravelAuthApi.me().then((user) => {
      if (user) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validatedData = authSchema.parse({
        email: formData.email,
        password: formData.password,
        fullName: isLogin ? undefined : formData.fullName,
      });

      if (isLogin) {
        await laravelAuthApi.login({
          email: validatedData.email,
          password: validatedData.password,
        });

        await refreshSession();
        toast.success("Connexion réussie !");
        navigate("/");
      } else {
        await laravelAuthApi.register({
          email: validatedData.email,
          password: validatedData.password,
          full_name: validatedData.fullName || validatedData.email,
        });

        await refreshSession();
        toast.success("Compte créé avec succès !");
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toastApiError(error, {
          mapMessage: (message) => {
            const lowered = message.toLowerCase();
            if (lowered.includes("invalid credentials")) {
              return "Email ou mot de passe incorrect";
            }
            if (lowered.includes("email")) {
              return "Cet email est déjà utilisé";
            }
            return null;
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-[26px] font-bold">SMART SCHOOL</CardTitle>
            <CardDescription>
              {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Accès admin uniquement via Filament. Tous les autres rôles utilisent cette interface.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary shadow-sm"
              disabled={loading}
            >
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin
                ? "Pas encore de compte ? S'inscrire"
                : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
