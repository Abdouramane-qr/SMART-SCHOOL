import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getStatusVariant } from "@/lib/statusMap";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  UserX,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { laravelAbsencesApi, laravelClassesApi, laravelSchoolYearsApi, laravelStudentsApi } from "@/services/laravelSchoolApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Absence {
  id: string | number;
  student_id: string | number;
  class_id: string | number;
  absence_date: string;
  absence_type: string;
  justified: boolean;
  reason: string | null;
  duration_minutes: number;
  students?: { full_name: string; student_id: string } | null;
  classes?: { name: string; level: string } | null;
}

export default function Absences() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterJustified, setFilterJustified] = useState<string>("all");

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    absence_date: format(new Date(), "yyyy-MM-dd"),
    absence_type: "absence",
    justified: false,
    reason: "",
    duration_minutes: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [absencesRes, studentsRes, classesRes] = await Promise.all([
        laravelAbsencesApi.getAll(),
        laravelStudentsApi.getAll().then((res) => res.items),
        laravelClassesApi.getAll(),
      ]);

      setAbsences(absencesRes || []);
      setStudents(studentsRes || []);
      setClasses(classesRes || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const schoolYear = await laravelSchoolYearsApi.getCurrent();

      const insertData = {
        ...formData,
        student_id: Number(formData.student_id),
        class_id: Number(formData.class_id),
        school_year_id: schoolYear?.id || null,
      };

      await laravelAbsencesApi.create(insertData);

      toast.success("Absence enregistrée avec succès");
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsence) return;

    try {
      await laravelAbsencesApi.update(selectedAbsence.id, {
        student_id: Number(formData.student_id),
        class_id: Number(formData.class_id),
        absence_date: formData.absence_date,
        absence_type: formData.absence_type,
        justified: formData.justified,
        reason: formData.reason || null,
        duration_minutes: formData.duration_minutes,
      });

      toast.success("Absence mise à jour");
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!selectedAbsence) return;

    try {
      await laravelAbsencesApi.delete(selectedAbsence.id);

      toast.success("Absence supprimée");
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      class_id: "",
      absence_date: format(new Date(), "yyyy-MM-dd"),
      absence_type: "absence",
      justified: false,
      reason: "",
      duration_minutes: 0,
    });
  };

  const openEdit = (absence: Absence) => {
    setSelectedAbsence(absence);
    setFormData({
      student_id: String(absence.student_id),
      class_id: String(absence.class_id),
      absence_date: absence.absence_date,
      absence_type: absence.absence_type,
      justified: absence.justified,
      reason: absence.reason || "",
      duration_minutes: absence.duration_minutes,
    });
    setIsEditOpen(true);
  };

  const filteredAbsences = absences.filter((a) => {
    const matchesSearch =
      a.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.students?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === "all" || String(a.class_id) === filterClass;
    const matchesType = filterType === "all" || a.absence_type === filterType;
    const matchesJustified =
      filterJustified === "all" ||
      (filterJustified === "justified" && a.justified) ||
      (filterJustified === "unjustified" && !a.justified);
    return matchesSearch && matchesClass && matchesType && matchesJustified;
  });

  // Statistics
  const totalAbsences = absences.filter((a) => a.absence_type === "absence").length;
  const totalRetards = absences.filter((a) => a.absence_type === "retard").length;
  const justifiedCount = absences.filter((a) => a.justified).length;
  const unjustifiedCount = absences.length - justifiedCount;

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Rapport des Absences et Retards", 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`, 14, 30);

    const tableData = filteredAbsences.map((a) => [
      a.students?.full_name || "N/A",
      `${a.classes?.level} ${a.classes?.name}` || "N/A",
      format(new Date(a.absence_date), "dd/MM/yyyy"),
      a.absence_type === "absence" ? "Absence" : "Retard",
      a.justified ? "Oui" : "Non",
      a.reason || "-",
    ]);

    autoTable(doc, {
      head: [["Élève", "Classe", "Date", "Type", "Justifié", "Motif"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [18, 115, 211] },
    });

    doc.save(`rapport-absences-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Rapport PDF généré");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Gestion des absences"
        description="Suivi des absences et retards des élèves"
        icon={UserX}
        actions={
          <>
            <ActionTooltip tooltipKey="exportAbsences">
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="mr-2 h-4 w-4" />
                Exporter PDF
              </Button>
            </ActionTooltip>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <ActionTooltip tooltipKey="addAbsence">
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle absence
                  </Button>
                </DialogTrigger>
              </ActionTooltip>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer une absence</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de l'absence ou du retard
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Élève *</Label>
                    <Select
                      value={formData.student_id}
                      onValueChange={(v) => {
                        const selected = students.find((student) => String(student.id) === v);
                        const classId = selected?.classe?.id ?? selected?.class?.id ?? selected?.classe_id;
                        setFormData({
                          ...formData,
                          student_id: v,
                          class_id: classId ? String(classId) : formData.class_id,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un élève" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={`${s.id}`}>
                            {s.full_name} ({s.student_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Classe *</Label>
                    <Select
                      value={formData.class_id}
                      onValueChange={(v) => setFormData({ ...formData, class_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={`${c.id}`}>
                            {c.level} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.absence_date}
                        onChange={(e) =>
                          setFormData({ ...formData, absence_date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={formData.absence_type}
                        onValueChange={(v) => setFormData({ ...formData, absence_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="absence">Absence</SelectItem>
                          <SelectItem value="retard">Retard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.absence_type === "retard" && (
                    <div className="space-y-2">
                      <Label>Durée (minutes)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.duration_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration_minutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="justified"
                      checked={formData.justified}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, justified: checked as boolean })
                      }
                    />
                    <Label htmlFor="justified">Justifié</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Motif</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Raison de l'absence..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={!formData.student_id || !formData.class_id}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Absences" value={totalAbsences.toString()} icon={UserX} />
        <StatsCard title="Retards" value={totalRetards.toString()} icon={Clock} />
        <StatsCard
          title="Justifiés"
          value={justifiedCount.toString()}
          icon={CheckCircle}
          trend={{ value: "", positive: true }}
        />
        <StatsCard
          title="Non justifiés"
          value={unjustifiedCount.toString()}
          icon={AlertTriangle}
          trend={{ value: "", positive: false }}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={`${c.id}`}>
                    {c.level} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="absence">Absences</SelectItem>
                <SelectItem value="retard">Retards</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterJustified} onValueChange={setFilterJustified}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Justification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="justified">Justifiés</SelectItem>
                <SelectItem value="unjustified">Non justifiés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Justifié</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbsences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune absence trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAbsences.map((absence) => (
                  <TableRow key={absence.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{absence.students?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {absence.students?.student_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {absence.classes?.level} {absence.classes?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(absence.absence_date), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          absence.absence_type === "absence"
                            ? getStatusVariant("destructive")
                            : "secondary"
                        }
                      >
                        {absence.absence_type === "absence" ? "Absence" : "Retard"}
                        {absence.absence_type === "retard" &&
                          absence.duration_minutes > 0 &&
                          ` (${absence.duration_minutes}min)`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {absence.justified ? (
                        <Badge variant={getStatusVariant("success")}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Oui
                        </Badge>
                      ) : (
                        <Badge variant={getStatusVariant("warning")}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Non
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {absence.reason || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <ActionTooltip tooltipKey="editAbsence">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(absence)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip tooltipKey="deleteAbsence">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedAbsence(absence);
                              setIsDeleteOpen(true);
                            }}
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'absence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Élève</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(v) => {
                    const selected = students.find((student) => String(student.id) === v);
                    const classId = selected?.classe?.id ?? selected?.class?.id ?? selected?.classe_id;
                    setFormData({
                      ...formData,
                      student_id: v,
                      class_id: classId ? String(classId) : formData.class_id,
                    });
                  }}
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={`${s.id}`}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.absence_date}
                  onChange={(e) =>
                    setFormData({ ...formData, absence_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.absence_type}
                  onValueChange={(v) => setFormData({ ...formData, absence_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absence">Absence</SelectItem>
                    <SelectItem value="retard">Retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-justified"
                checked={formData.justified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, justified: checked as boolean })
                }
              />
              <Label htmlFor="edit-justified">Justifié</Label>
            </div>

            <div className="space-y-2">
              <Label>Motif</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette absence pour{" "}
              <strong>{selectedAbsence?.students?.full_name}</strong> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
