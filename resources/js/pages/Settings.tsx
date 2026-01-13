import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  BookMarked, 
  Building2, 
  UserCog, 
  Settings as SettingsIcon,
  Shield,
  Database,
  Bell
} from "lucide-react";
import SchoolYears from "./SchoolYears";
import Subjects from "./Subjects";
import Classrooms from "./Classrooms";
import UserManagement from "./UserManagement";
import { useUserRole } from "@/hooks/useUserRole";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("school-years");
  const { isAdmin } = useUserRole();

  const tabs = [
    { 
      id: "school-years", 
      label: "Années scolaires", 
      icon: Calendar,
      description: "Gérez les années scolaires et définissez l'année en cours"
    },
    { 
      id: "subjects", 
      label: "Matières", 
      icon: BookMarked,
      description: "Configurez les matières enseignées et leurs coefficients"
    },
    { 
      id: "classrooms", 
      label: "Salles", 
      icon: Building2,
      description: "Gérez les salles de classe et leurs équipements"
    },
    { 
      id: "users", 
      label: "Utilisateurs", 
      icon: UserCog,
      description: "Gérez les utilisateurs et leurs rôles d'accès"
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
          <SettingsIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-[26px] md:text-[28px] font-bold text-foreground">Paramètres</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Configuration générale de l'établissement
          </p>
        </div>
      </div>

      {/* Settings Cards Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => (
          <Card
            key={tab.id} 
            className={`cursor-pointer transition-colors hover:border-primary/50 ${
              activeTab === tab.id ? 'border-primary shadow-sm' : ''
            }`}
            density="compact"
            onClick={() => setActiveTab(tab.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  <tab.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{tab.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tab.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="school-years" className="mt-6">
          <Card density="spacious">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Gestion des Années Scolaires
              </CardTitle>
              <CardDescription>
                Créez et gérez les années scolaires. Définissez l'année en cours pour l'ensemble du système.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolYearsContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <Card density="spacious">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                Gestion des Matières
              </CardTitle>
              <CardDescription>
                Configurez les matières enseignées, leurs codes et coefficients pour le calcul des moyennes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectsContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classrooms" className="mt-6">
          <Card density="spacious">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Gestion des Salles
              </CardTitle>
              <CardDescription>
                Gérez les salles de classe, leur capacité, emplacement et équipements disponibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassroomsContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card density="spacious">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et attribuez les rôles d'accès (Admin, Comptable, Enseignant, Élève, Parent).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info Card */}
      <Card className="bg-muted/50" density="spacious" variant="premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Informations Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Sécurité</p>
                <p className="text-xs text-muted-foreground">RLS activé</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Base de données</p>
                <p className="text-xs text-muted-foreground">Connectée</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Temps réel activé</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper components to embed existing pages without their headers
function SchoolYearsContent() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Import and use the internal logic from SchoolYears
  // For now, render the full page embedded
  return <SchoolYears />;
}

function SubjectsContent() {
  return <Subjects />;
}

function ClassroomsContent() {
  return <Classrooms />;
}
