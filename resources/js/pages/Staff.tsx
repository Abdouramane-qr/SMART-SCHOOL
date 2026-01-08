import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus, DollarSign, Calendar, Edit, Trash2, History, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { laravelTeachersApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTeacherDialog } from "@/components/staff/AddTeacherDialog";
import { EditTeacherDialog } from "@/components/staff/EditTeacherDialog";
import { DeleteTeacherDialog } from "@/components/staff/DeleteTeacherDialog";
import { TeacherSalaryDialog } from "@/components/staff/TeacherSalaryDialog";
import { TeacherAuditModal } from "@/components/staff/TeacherAuditModal";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { formatAmount, CURRENCIES } from "@/lib/financeUtils";
import { useFinanceCurrency } from "@/hooks/useFinanceCurrency";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

export default function Staff() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const { defaultCurrency } = useFinanceCurrency();

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const filtered = teachers.filter((teacher) => {
      const name = teacher.profiles?.full_name?.toLowerCase() || "";
      const email = teacher.profiles?.email?.toLowerCase() || "";
      const spec = teacher.specialization?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search) || spec.includes(search);
    });
    setFilteredTeachers(filtered);
    setCurrentPage(1);
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    try {
      const data = await laravelTeachersApi.getAll();
      setTeachers(data || []);
      setFilteredTeachers(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du personnel");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayAmount = (amount: number) => formatAmount(amount, defaultCurrency);
  const currencySymbol = CURRENCIES[defaultCurrency]?.symbol ?? defaultCurrency;

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleEdit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditDialogOpen(true);
  };

  const handleDelete = (teacher: any) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  const handleSalary = (teacher: any) => {
    setSelectedTeacher(teacher);
    setSalaryDialogOpen(true);
  };

  const handleAudit = (teacher: any) => {
    setSelectedTeacher(teacher);
    setAuditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Gestion du Personnel</h1>
          <p className="text-muted-foreground mt-1">
            {teachers.length} enseignant(s) enregistré(s)
          </p>
        </div>
        <ActionTooltip tooltipKey="addTeacher">
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel enseignant
          </Button>
        </ActionTooltip>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enseignants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Masse Salariale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDisplayAmount(
                teachers.reduce((sum, t) => sum + parseFloat(t.monthly_salary || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">par mois</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Salaire Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.length > 0
                ? formatDisplayAmount(
                    teachers.reduce((sum, t) => sum + parseFloat(t.monthly_salary || 0), 0) /
                      teachers.length
                  )
                : formatDisplayAmount(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou spécialisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Liste du Personnel Enseignant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Spécialisation</TableHead>
                <TableHead>Salaire mensuel ({currencySymbol})</TableHead>
                <TableHead>Date d'embauche</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun enseignant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.profiles?.full_name || "N/A"}
                    </TableCell>
                    <TableCell>{teacher.profiles?.email || "N/A"}</TableCell>
                    <TableCell>{teacher.profiles?.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{teacher.specialization || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatDisplayAmount(parseFloat(teacher.monthly_salary || 0))}
                    </TableCell>
                    <TableCell>
                      {teacher.hire_date
                        ? new Date(teacher.hire_date).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ActionTooltip tooltipKey="teacherSalary">
                          <Button variant="ghost" size="sm" onClick={() => handleSalary(teacher)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip tooltipKey="editTeacher">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip tooltipKey="teacherAudit">
                          <Button variant="ghost" size="sm" onClick={() => handleAudit(teacher)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip tooltipKey="deleteTeacher">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(teacher)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({filteredTeachers.length} résultats)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddTeacherDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchTeachers}
      />
      <EditTeacherDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        teacher={selectedTeacher}
        onSuccess={fetchTeachers}
      />
      <DeleteTeacherDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        teacher={selectedTeacher}
        onSuccess={fetchTeachers}
      />
      <TeacherSalaryDialog
        open={salaryDialogOpen}
        onOpenChange={setSalaryDialogOpen}
        teacher={selectedTeacher}
      />
      <TeacherAuditModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        teacher={selectedTeacher}
      />
    </div>
  );
}
