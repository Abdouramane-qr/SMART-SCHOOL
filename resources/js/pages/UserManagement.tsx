import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserCog, Shield, Plus, Trash2, Users, UserPlus } from "lucide-react";
import { laravelRolesApi, laravelUsersApi } from "@/services/laravelUsersApi";
import { toast } from "sonner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { ActionTooltip } from "@/components/ui/ActionTooltip";

type AppRole = "admin" | "comptable" | "enseignant" | "eleve" | "parent";

interface UserWithRoles {
  id: number;
  email: string;
  full_name: string;
  roles: AppRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  comptable: "Comptable",
  enseignant: "Enseignant",
  eleve: "Élève",
  parent: "Parent",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-background text-foreground border border-brand-neutral",
  comptable: "bg-background text-foreground border border-brand-neutral",
  enseignant: "bg-background text-foreground border border-brand-neutral",
  eleve: "bg-background text-foreground border border-brand-neutral",
  parent: "bg-background text-foreground border border-brand-neutral",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await laravelUsersApi.getAll();
      const usersWithRoles: UserWithRoles[] = users.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name || user.email,
        roles: (user.roles || [])
          .map((role) => (role === "super_admin" || role === "admin_ecole" ? "admin" : role))
          .filter(Boolean) as AppRole[],
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;

    setAddingRole(true);
    try {
      await laravelRolesApi.assignRole({
        user_id: selectedUser.id,
        role: newRole,
      });

      toast.success(`Rôle ${ROLE_LABELS[newRole]} ajouté avec succès`);
      fetchUsers();
      setIsAddRoleOpen(false);
      setNewRole("");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error adding role:", error);
      toast.error("Erreur lors de l'ajout du rôle");
    } finally {
      setAddingRole(false);
    }
  };

  const handleRemoveRole = async (userId: number, role: AppRole) => {
    try {
      await laravelRolesApi.removeRole({ user_id: userId, role });

      toast.success(`Rôle ${ROLE_LABELS[role]} supprimé avec succès`);
      fetchUsers();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error removing role:", error);
      toast.error("Erreur lors de la suppression du rôle");
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.roles.includes("admin")).length,
    teachers: users.filter(u => u.roles.includes("enseignant")).length,
    students: users.filter(u => u.roles.includes("eleve")).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-neutral"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles et permissions des utilisateurs
          </p>
        </div>
        <ActionTooltip tooltipKey="addUser">
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </ActionTooltip>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Utilisateurs"
          value={stats.totalUsers.toString()}
          icon={Users}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Administrateurs"
          value={stats.admins.toString()}
          icon={Shield}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Enseignants"
          value={stats.teachers.toString()}
          icon={UserCog}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Élèves"
          value={stats.students.toString()}
          icon={Users}
          trend={{ value: "", positive: true }}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Liste des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">Aucun rôle</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className={`${ROLE_COLORS[role]} flex items-center gap-1`}
                            >
                              {ROLE_LABELS[role]}
                              <ActionTooltip tooltipKey="removeRole">
                                <button
                                  onClick={() => handleRemoveRole(user.id, role)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </ActionTooltip>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionTooltip tooltipKey="addRole">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsAddRoleOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter rôle
                        </Button>
                      </ActionTooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onSuccess={fetchUsers}
      />

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un rôle</DialogTitle>
            <DialogDescription>
              Ajouter un rôle à {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {(["admin", "comptable", "enseignant", "eleve", "parent"] as AppRole[])
                  .filter(role => !selectedUser?.roles.includes(role))
                  .map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddRole} disabled={!newRole || addingRole}>
              {addingRole ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
