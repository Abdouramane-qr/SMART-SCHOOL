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
import { Search, Edit, Trash2, Calendar, Check, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { laravelSchoolYearsApi, type LaravelSchoolYear } from "@/services/laravelSchoolApi";
import { AddSchoolYearDialog } from "@/components/school-years/AddSchoolYearDialog";
import { EditSchoolYearDialog } from "@/components/school-years/EditSchoolYearDialog";
import { DeleteSchoolYearDialog } from "@/components/school-years/DeleteSchoolYearDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useToast } from "@/hooks/use-toast";

type SchoolYear = LaravelSchoolYear & {
  created_at?: string | null;
};

export default function SchoolYears() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editYear, setEditYear] = useState<SchoolYear | null>(null);
  const [deleteYear, setDeleteYear] = useState<SchoolYear | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: schoolYears = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["schoolYears"],
    queryFn: laravelSchoolYearsApi.getAll,
  });

  const setCurrentMutation = useMutation({
    mutationFn: laravelSchoolYearsApi.setCurrent,
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Année scolaire courante mise à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de définir l'année courante",
        variant: "destructive",
      });
    },
  });

  const filteredYears = schoolYears.filter((year) =>
    year.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalYears = schoolYears.length;
  const currentYear = schoolYears.find((y) => y.is_current);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Années scolaires</h1>
          <p className="text-muted-foreground mt-1">
            {totalYears} année{totalYears > 1 ? "s" : ""} enregistrée{totalYears > 1 ? "s" : ""}
          </p>
        </div>
        <AddSchoolYearDialog onSuccess={refetch} />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total années"
          value={totalYears.toString()}
          icon={Calendar}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Année courante"
          value={currentYear?.name || "Non définie"}
          icon={Star}
          trend={{ value: "", positive: true }}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une année scolaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* School Years Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredYears.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune année scolaire trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredYears.map((year) => (
                  <TableRow key={year.id} className={year.is_current ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {year.name}
                        {year.is_current && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="h-3 w-3 mr-1" />
                            Courante
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(year.start_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      {new Date(year.end_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-center">
                      {year.is_current ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!year.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMutation.mutate(year.id)}
                            disabled={setCurrentMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Définir courante
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditYear(year)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteYear(year)}
                          disabled={year.is_current}
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
      <EditSchoolYearDialog
        schoolYear={editYear}
        open={!!editYear}
        onOpenChange={(open) => !open && setEditYear(null)}
        onSuccess={refetch}
      />
      <DeleteSchoolYearDialog
        schoolYear={deleteYear}
        open={!!deleteYear}
        onOpenChange={(open) => !open && setDeleteYear(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
