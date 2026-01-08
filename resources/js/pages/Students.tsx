import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import {
  laravelClassesApi,
  laravelFinanceApi,
  laravelFinanceSettingsApi,
  laravelStudentsApi,
  normalizeStudentClasse,
  normalizeStudentName,
  normalizeStudentPayments,
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

  const students = useMemo<StudentWithPayments[]>(() => {
    const rawStudents = studentsQuery.data?.items || [];
    return rawStudents.map((student) => {
      const { totalDue, totalPaid } = normalizeStudentPayments(student);
      return {
        id: String(student.id),
        full_name: normalizeStudentName(student),
        student_id: student.student_id || "",
        class_name: normalizeStudentClasse(student),
        total_paid: totalPaid,
        total_due: totalDue,
      };
    });
  }, [studentsQuery.data?.items]);

  const classes = useMemo(() => classesQuery.data || [], [classesQuery.data]);

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
  const handleViewDetails = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const handleNewPayment = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setIsPaymentOpen(true);
  };

  const handleEdit = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
  };

  const handleDelete = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleViewAudit = (student: StudentWithPayments) => {
    setSelectedStudent(student);
    setIsAuditOpen(true);
  };

  const handleSuccess = () => {
    studentsQuery.refetch();
  };

  const isLoading = studentsQuery.isLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Gestion des élèves"
        description={`${totalItems} élève(s) inscrit(s)`}
        icon={Users}
        actions={
          <ActionTooltip tooltipKey="addStudent">
            <Button onClick={() => setIsAddOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel élève
            </Button>
          </ActionTooltip>
        }
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-md">
              <CardContent className="p-4 space-y-3">
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
            />
            <StatsCard
              title="Totalement payés"
              value={stats.totalPaid}
              icon={CheckCircle}
              trend={{ value: "0%", positive: true }}
            />
            <StatsCard
              title="Impayés"
              value={stats.unpaid}
              icon={XCircle}
              trend={{ value: "0%", positive: false }}
            />
          </>
        )}
      </div>

      <Card className="shadow-md">
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
                    <div className="flex flex-col items-center gap-3 py-6">
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
                    <TableRow key={student.id}>
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
                              <DropdownMenuItem onClick={() => handleEdit(student)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewAudit(student)}>
                                <History className="mr-2 h-4 w-4" />
                                Historique
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(student)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
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
                studentsQuery.refetch();
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
