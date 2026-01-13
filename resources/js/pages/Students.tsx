import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  UserPlus,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImportExportActions } from "@/components/ImportExportActions";
import { RoleGuard } from "@/components/RoleGuard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  laravelClassesApi,
  laravelFinanceApi,
  laravelFinanceSettingsApi,
  laravelStudentsApi,
  normalizeStudentClasse,
  normalizeStudentName,
  normalizeStudentPayments,
  type LaravelEleve,
} from "@/services/laravelSchoolApi";
import { formatAmount, type Currency } from "@/lib/financeUtils";
import { getStatusTextClass } from "@/lib/statusMap";

const StudentDetailsModal = lazy(() =>
  import("@/components/students/StudentDetailsModal").then((module) => ({
    default: module.StudentDetailsModal,
  })),
);
const NewPaymentDialog = lazy(() =>
  import("@/components/students/NewPaymentDialog").then((module) => ({
    default: module.NewPaymentDialog,
  })),
);
const AddStudentDialog = lazy(() =>
  import("@/components/students/AddStudentDialog").then((module) => ({
    default: module.AddStudentDialog,
  })),
);
const EditStudentDialog = lazy(() =>
  import("@/components/students/EditStudentDialog").then((module) => ({
    default: module.EditStudentDialog,
  })),
);
const DeleteStudentDialog = lazy(() =>
  import("@/components/students/DeleteStudentDialog").then((module) => ({
    default: module.DeleteStudentDialog,
  })),
);
const StudentAuditModal = lazy(() =>
  import("@/components/students/StudentAuditModal").then((module) => ({
    default: module.StudentAuditModal,
  })),
);

interface StudentWithPayments {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  total_paid: number;
  total_due: number;
}

const ITEMS_PER_PAGE = 10;

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPayments | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<LaravelEleve | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pendingDetailsOpen, setPendingDetailsOpen] = useState(false);

  const resolveDetailsError = (error: unknown) => {
    if (error && typeof error === "object") {
      const status = (error as { status?: number }).status;
      const code = (error as { code?: string }).code;
      if (status === 409 || code === "active_school_missing") {
        return "Aucune école active n'est définie. Activez une école pour continuer.";
      }
      if (status === 403) {
        if (code === "school_mismatch") {
          return "Cet élève n'appartient pas à l'école active.";
        }
        return "Accès refusé. Vos permissions ne permettent pas d'accéder à cette fiche.";
      }
      if ((error as { message?: string }).message) {
        return (error as { message: string }).message;
      }
    }
    return "Impossible de charger les détails de l'élève.";
  };

  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    queryKey: ["laravel", "classes"],
    queryFn: () => laravelClassesApi.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const studentsQuery = useQuery({
    queryKey: ["laravel", "students", currentPage, searchTerm, selectedClass],
    queryFn: () =>
      laravelStudentsApi.getAll({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        q: searchTerm || undefined,
        classId: selectedClass === "all" ? undefined : selectedClass,
      }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const financeStatsQuery = useQuery({
    queryKey: ["laravel", "finance-stats"],
    queryFn: () => laravelFinanceApi.getStats(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const financeSettingsQuery = useQuery({
    queryKey: ["laravel", "finance-settings"],
    queryFn: () => laravelFinanceSettingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (studentsQuery.isError) {
      toast.error("Erreur lors du chargement des élèves");
    }
  }, [studentsQuery.isError]);

  useEffect(() => {
    if (classesQuery.isError) {
      toast.error("Erreur lors du chargement des classes");
    }
  }, [classesQuery.isError]);

  useEffect(() => {
    let canceled = false;
    if (!selectedStudentId) {
      setDetailData(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);

    laravelStudentsApi
      .getById(selectedStudentId)
      .then((data) => {
        if (canceled) return;
        setDetailData(data);
      })
      .catch((error) => {
        if (canceled) return;
        setDetailError(resolveDetailsError(error));
        setDetailData(null);
      })
      .finally(() => {
        if (canceled) return;
        setDetailLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [selectedStudentId]);

  useEffect(() => {
    if (!pendingDetailsOpen) {
      return;
    }

    if (detailLoading) {
      return;
    }

    if (detailError) {
      toast.error(detailError);
      setPendingDetailsOpen(false);
      return;
    }

    if (!detailData || !selectedStudentId || String(detailData.id) !== String(selectedStudentId)) {
      toast.error("Impossible de charger la fiche élève.");
      setPendingDetailsOpen(false);
      return;
    }

    setIsDetailsOpen(true);
    setPendingDetailsOpen(false);
  }, [pendingDetailsOpen, detailLoading, detailError, detailData, selectedStudentId]);

  const students = useMemo<StudentWithPayments[]>(() => {
    const rawStudents = studentsQuery.data?.items || [];
    return rawStudents.map((student) => {
      const { totalDue, totalPaid } = normalizeStudentPayments(student);
      return {
        id: String(student.id),
        full_name: normalizeStudentName(student),
        student_id: student.student_id || "",
        class_name: normalizeStudentClasse(student),
        first_name: student.first_name ?? null,
        last_name: student.last_name ?? null,
        gender: student.gender ?? null,
        birth_date: student.birth_date ?? null,
        date_of_birth: student.date_of_birth ?? null,
        address: student.address ?? null,
        parent_name: student.parent_name ?? null,
        parent_phone: student.parent_phone ?? null,
        parent_email: student.parent_email ?? null,
        total_paid: totalPaid,
        total_due: totalDue,
      };
    });
  }, [studentsQuery.data?.items]);

  const { user, hasPermission } = useAuth();

  const classes = useMemo(() => classesQuery.data || [], [classesQuery.data]);
  const selectedClassName = useMemo(() => {
    if (selectedClass === "all") {
      return "Toutes les classes";
    }
    const matched = classes.find((cls) => String(cls.id) === selectedClass);
    if (!matched) {
      return "Classe non assignée";
    }
    return `${matched.level} ${matched.name}`;
  }, [classes, selectedClass]);

  const activeSchoolLabel = useMemo(() => {
    if (user?.active_school) {
      return `${user.active_school.name} (${user.active_school.code})`;
    }
    return "École active non définie";
  }, [user?.active_school]);

  const roleLabel = useMemo(() => {
    if (!user?.roles?.length) {
      return "Rôle non attribué";
    }
    return user.roles.map((role) => {
      if (role === "super_admin" || role === "admin_ecole") {
        return "Administrateur général";
      }
      if (role === "admin") {
        return "Administrateur";
      }
      if (role === "comptable") {
        return "Comptable";
      }
      if (role === "enseignant") {
        return "Enseignant";
      }
      if (role === "parent") {
        return "Parent";
      }
      if (role === "eleve") {
        return "Élève";
      }
      return role;
    }).join(" / ");
  }, [user?.roles]);

  const canCreateStudent = hasPermission("eleve.create");
  const canUpdateStudent = hasPermission("eleve.update");
  const canDeleteStudent = hasPermission("eleve.delete");
  const canManagePayments = hasPermission("paiement.create") || hasPermission("paiement.update");
  const isReadOnlyRole = !canUpdateStudent;
  const roleModeLabel = isReadOnlyRole ? "Lecture seule par rôle" : "Modifications autorisées";
  const roleModeHint = isReadOnlyRole
    ? "Vous ne pouvez que consulter les fiches dans l’école active."
    : "Vous pouvez modifier les fiches et facturer les paiements dans l’école active.";

  const detailPanelInfo = useMemo(() => {
    if (detailData) {
      const payments = normalizeStudentPayments(detailData);
      return {
        title: normalizeStudentName(detailData) || "Élève sélectionné",
        studentId: detailData.student_id || selectedStudent?.student_id || "ID non défini",
        classLabel: normalizeStudentClasse(detailData) || selectedStudent?.class_name || "Non assigné",
        birthDate: detailData.birth_date || detailData.date_of_birth || selectedStudent?.birth_date || null,
        gender: detailData.gender || selectedStudent?.gender || null,
        address: detailData.address || selectedStudent?.address || null,
        parentName: detailData.parent_name || selectedStudent?.parent_name || null,
        parentPhone: detailData.parent_phone || selectedStudent?.parent_phone || null,
        parentEmail: detailData.parent_email || selectedStudent?.parent_email || null,
        payments: payments.payments,
        totalPaid: payments.totalPaid,
        totalDue: payments.totalDue,
      };
    }

    return {
      title: selectedStudent?.full_name || "Aucun élève sélectionné",
      studentId: selectedStudent?.student_id || "ID non défini",
      classLabel: selectedStudent?.class_name || "Non assigné",
      birthDate: selectedStudent?.birth_date || selectedStudent?.date_of_birth || null,
      gender: selectedStudent?.gender || null,
      address: selectedStudent?.address || null,
      parentName: selectedStudent?.parent_name || null,
      parentPhone: selectedStudent?.parent_phone || null,
      parentEmail: selectedStudent?.parent_email || null,
      payments: [],
      totalPaid: selectedStudent?.total_paid || 0,
      totalDue: selectedStudent?.total_due || 0,
    };
  }, [detailData, selectedStudent]);

  const stats = useMemo(() => {
    const totalStudents = studentsQuery.data?.meta?.total ?? students.length;
    const fullyPaid = financeStatsQuery.data?.studentsUpToDate ?? 0;
    const unpaid = financeStatsQuery.data?.studentsNotUpToDate ?? 0;

    return {
      totalStudents,
      totalPaid: fullyPaid,
      unpaid,
    };
  }, [students, studentsQuery.data?.meta?.total, financeStatsQuery.data]);

  const defaultCurrency = useMemo<Currency>(() => {
    const settings = financeSettingsQuery.data || [];
    const raw = settings.find((setting) => setting.setting_key === "default_currency")?.setting_value;
    if (raw === "USD" || raw === "EUR" || raw === "XOF") {
      return raw;
    }
    return "XOF";
  }, [financeSettingsQuery.data]);

  const totalItems = studentsQuery.data?.meta?.total ?? students.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedStudents = students;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  // Handlers
  const selectStudent = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setSelectedStudentId(student.id);
  };

  const handleViewDetails = (student: StudentWithPayments) => {
    if (selectedStudentId !== student.id) {
      selectStudent(student);
      setPendingDetailsOpen(true);
      return;
    }

    if (detailLoading) {
      setPendingDetailsOpen(true);
      return;
    }

    if (detailError) {
      toast.error(detailError);
      return;
    }

    if (!detailData || String(detailData.id) !== student.id) {
      toast.error("Impossible de charger la fiche élève.");
      return;
    }

    setIsDetailsOpen(true);
  };

  const handleNewPayment = (student: StudentWithPayments) => {
    if (!canManagePayments) {
      return;
    }
    selectStudent(student);
    setIsPaymentOpen(true);
  };

  const handleEdit = (student: StudentWithPayments) => {
    selectStudent(student);
    setIsEditOpen(true);
  };

  const handleDelete = (student: StudentWithPayments) => {
    selectStudent(student);
    setIsDeleteOpen(true);
  };

  const handleViewAudit = (student: StudentWithPayments) => {
    selectStudent(student);
    setIsAuditOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["laravel", "students"] });
    queryClient.invalidateQueries({ queryKey: ["laravel", "finance-stats"] });
  };

  const isLoading = studentsQuery.isLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Gestion des élèves"
        description={`${totalItems} élève(s) inscrit(s)`}
        icon={Users}
        actions={
          <div className="flex gap-2">
            <RoleGuard allowedRoles={["admin"]}>
              <ImportExportActions entity="students" onImported={handleSuccess} />
            </RoleGuard>
            <ActionTooltip tooltipKey="addStudent">
              <Button
                onClick={() => setIsAddOpen(true)}
                disabled={!canCreateStudent}
                title={
                  !canCreateStudent
                    ? "Votre rôle ne vous autorise pas à créer des élèves."
                    : undefined
                }
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Nouvel élève
              </Button>
            </ActionTooltip>
          </div>
        }
      />

      {/* Role / school context banner */}
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/70 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Badge variant="secondary" className="text-[0.65rem]">
            École active
          </Badge>
          <span className="text-base text-foreground">{activeSchoolLabel}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={isReadOnlyRole ? "outline" : "secondary"}>{roleModeLabel}</Badge>
          <span className="text-foreground">Rôles détectés : {roleLabel}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{roleModeHint}</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} density="compact">
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total inscrits"
              value={stats.totalStudents}
              icon={Users}
              trend={{ value: "0%", positive: true }}
              density="compact"
            />
            <StatsCard
              title="Totalement payés"
              value={stats.totalPaid}
              icon={CheckCircle}
              trend={{ value: "0%", positive: true }}
              density="compact"
            />
            <StatsCard
              title="Impayés"
              value={stats.unpaid}
              icon={XCircle}
              trend={{ value: "0%", positive: false }}
              density="compact"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Card density="compact">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={String(cls.id)}>
                    {cls.level} {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 text-xs text-muted-foreground">
          <span>Filtre actif : {selectedClassName}</span>
          <span>
            {canCreateStudent
              ? "Vous pouvez créer de nouvelles fiches élèves."
              : "La création d’élèves n’est pas autorisée pour votre rôle."}
          </span>
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Montant restant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3 py-6 ui-empty-state rounded-xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full ui-empty-state-icon">
                        <Users className="h-6 w-6" />
                      </div>
                      <span>Aucun élève trouvé</span>
                      <ActionTooltip tooltipKey="addStudent">
                        <Button size="sm" onClick={() => setIsAddOpen(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Ajouter un élève
                        </Button>
                      </ActionTooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => {
                  const remaining = student.total_due - student.total_paid;
                  return (
                <TableRow
                  key={student.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => selectStudent(student)}
                >
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        {student.class_name ? (
                          <Badge variant="outline">{student.class_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${getStatusTextClass("success")}`}>
                        {formatAmount(student.total_paid, defaultCurrency)}
                      </TableCell>
                      <TableCell className={remaining > 0 ? "font-medium text-brand-neutral" : "text-muted-foreground"}>
                        {remaining > 0 ? formatAmount(remaining, defaultCurrency) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ActionTooltip tooltipKey="viewStudentDetails">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(student)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip tooltipKey="studentPayment">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleNewPayment(student)}
                              disabled={!canManagePayments}
                              title={
                                !canManagePayments
                                  ? "Seuls les rôles finance/comptabilité peuvent créer un paiement."
                                  : undefined
                              }
                            >
                              <DollarSign className="mr-1 h-3 w-3" />
                              Paiement
                            </Button>
                          </ActionTooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdateStudent ? (
                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modification limitée
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleViewAudit(student)}>
                                <History className="mr-2 h-4 w-4" />
                                Historique
                              </DropdownMenuItem>
                              {canDeleteStudent && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(student)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur{" "}
                {totalItems} élèves
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">Détails de l'élève</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Informations personnelles, parentales et financières.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wider">
                  {selectedStudentId ? "Sélectionné" : "Aucune sélection"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : detailError ? (
                <p className="text-sm text-destructive">{detailError}</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">ID Élève</p>
                      <p className="font-semibold text-foreground">{detailPanelInfo.studentId}</p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">Nom complet</p>
                      <p className="font-semibold text-foreground">{detailPanelInfo.title}</p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">Classe</p>
                      <p className="font-semibold text-foreground">{detailPanelInfo.classLabel}</p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">Date de naissance</p>
                      <p className="font-semibold text-foreground">
                        {detailPanelInfo.birthDate
                          ? new Date(detailPanelInfo.birthDate).toLocaleDateString("fr-FR")
                          : "Non renseigné"}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">Genre</p>
                      <p className="font-semibold text-foreground">
                        {detailPanelInfo.gender || "Non renseigné"}
                      </p>
                    </div>
                    <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-xs">
                      <p className="text-muted-foreground">Adresse</p>
                      <p className="font-semibold text-foreground">
                        {detailPanelInfo.address || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Informations parentales
                    </p>
                    <div className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Nom du parent</p>
                        <p className="font-medium text-foreground">
                          {detailPanelInfo.parentName || "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Téléphone</p>
                        <p className="font-medium text-foreground">
                          {detailPanelInfo.parentPhone || "Non renseigné"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium text-foreground">
                          {detailPanelInfo.parentEmail || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Historique des paiements
                      </p>
                      <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                        <span>Total payé : {formatAmount(detailPanelInfo.totalPaid, defaultCurrency)}</span>
                        <span>Total dû : {formatAmount(detailPanelInfo.totalDue, defaultCurrency)}</span>
                      </div>
                    </div>

                    {detailPanelInfo.payments.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Aucun paiement enregistré
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Méthode</TableHead>
                              <TableHead>Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailPanelInfo.payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {payment.payment_date
                                    ? new Date(payment.payment_date).toLocaleDateString("fr-FR")
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  {formatAmount(payment.paid_amount ?? payment.amount ?? 0, defaultCurrency)}
                                </TableCell>
                                <TableCell>{payment.method || payment.payment_type || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{payment.status || "—"}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      onClick={() => selectedStudent && handleViewDetails(selectedStudent)}
                      disabled={!selectedStudent}
                      fullWidth
                    >
                      Voir la fiche complète
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedStudent && handleNewPayment(selectedStudent)}
                      disabled={!selectedStudent || !canManagePayments}
                    >
                      Enregistrer un paiement
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <AddStudentDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleSuccess}
        />

        {selectedStudent && (
          <>
            <StudentDetailsModal
              student={selectedStudent}
              isOpen={isDetailsOpen}
              onClose={() => setIsDetailsOpen(false)}
              currency={defaultCurrency}
            />
            <NewPaymentDialog
              student={selectedStudent}
              isOpen={isPaymentOpen}
              onClose={() => {
                setIsPaymentOpen(false);
                queryClient.invalidateQueries({ queryKey: ["laravel", "students"] });
                queryClient.invalidateQueries({ queryKey: ["laravel", "finance-stats"] });
              }}
              currency={defaultCurrency}
            />
            <EditStudentDialog
              student={selectedStudent}
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              onSuccess={handleSuccess}
            />
            <DeleteStudentDialog
              student={selectedStudent}
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              onSuccess={handleSuccess}
            />
            <StudentAuditModal
              studentId={selectedStudent.id}
              studentName={selectedStudent.full_name}
              isOpen={isAuditOpen}
              onClose={() => setIsAuditOpen(false)}
            />
          </>
        )}
      </Suspense>
    </div>
  );
}
