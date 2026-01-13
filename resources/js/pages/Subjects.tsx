import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Edit, Trash2, BookOpen, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laravelSubjectsApi, type LaravelSubject } from "@/services/laravelSchoolApi";
import { AddSubjectDialog } from "@/components/subjects/AddSubjectDialog";
import { EditSubjectDialog } from "@/components/subjects/EditSubjectDialog";
import { DeleteSubjectDialog } from "@/components/subjects/DeleteSubjectDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ImportExportActions } from "@/components/ImportExportActions";
import { RoleGuard } from "@/components/RoleGuard";

type Subject = LaravelSubject & {
  created_at?: string | null;
};

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);

  const {
    data: subjects = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["subjects"],
    queryFn: laravelSubjectsApi.getAll,
  });

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubjects = subjects.length;
  const totalCoefficients = subjects.reduce((sum, s) => sum + (s.coefficient || 1), 0);
  const avgCoefficient = totalSubjects > 0 ? totalCoefficients / totalSubjects : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Gestion des matières</h1>
          <p className="text-muted-foreground mt-1">
            {totalSubjects} matière{totalSubjects > 1 ? "s" : ""} enregistrée{totalSubjects > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <RoleGuard allowedRoles={["admin"]}>
            <ImportExportActions entity="subjects" onImported={refetch} />
          </RoleGuard>
          <AddSubjectDialog onSuccess={refetch} />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total matières"
          value={totalSubjects.toString()}
          icon={BookOpen}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Total coefficients"
          value={totalCoefficients.toString()}
          icon={Hash}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Coefficient moyen"
          value={avgCoefficient.toFixed(1)}
          icon={Hash}
          trend={{ value: "0%", positive: true }}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une matière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12 ui-empty-state rounded-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ui-empty-state-icon">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground">Aucune matière trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {subject.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold">
                        {subject.coefficient || 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(subject.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditSubject(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteSubject(subject)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditSubjectDialog
        subject={editSubject}
        open={!!editSubject}
        onOpenChange={(open) => !open && setEditSubject(null)}
        onSuccess={refetch}
      />
      <DeleteSubjectDialog
        subject={deleteSubject}
        open={!!deleteSubject}
        onOpenChange={(open) => !open && setDeleteSubject(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
