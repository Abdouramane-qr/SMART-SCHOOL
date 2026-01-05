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
import { Search, Edit, Trash2, Building, Users, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { laravelClassroomsApi, type LaravelClassroom } from "@/services/laravelSchoolApi";
import { AddClassroomDialog } from "@/components/classrooms/AddClassroomDialog";
import { EditClassroomDialog } from "@/components/classrooms/EditClassroomDialog";
import { DeleteClassroomDialog } from "@/components/classrooms/DeleteClassroomDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";

type Classroom = LaravelClassroom & {
  created_at?: string | null;
};

export default function Classrooms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editClassroom, setEditClassroom] = useState<Classroom | null>(null);
  const [deleteClassroom, setDeleteClassroom] = useState<Classroom | null>(null);

  const {
    data: classrooms = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["classrooms"],
    queryFn: laravelClassroomsApi.getAll,
  });

  const filteredClassrooms = (classrooms as Classroom[]).filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClassrooms = classrooms.length;
  const totalCapacity = (classrooms as Classroom[]).reduce((sum, r) => sum + (r.capacity || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground">Gestion des salles</h1>
          <p className="text-muted-foreground mt-1">
            {totalClassrooms} salle{totalClassrooms > 1 ? "s" : ""} de classe
          </p>
        </div>
        <AddClassroomDialog onSuccess={refetch} />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total salles"
          value={totalClassrooms.toString()}
          icon={Building}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Capacité totale"
          value={`${totalCapacity} places`}
          icon={Users}
          trend={{ value: "0%", positive: true }}
        />
        <StatsCard
          title="Capacité moyenne"
          value={totalClassrooms > 0 ? `${Math.round(totalCapacity / totalClassrooms)} places` : "0"}
          icon={MapPin}
          trend={{ value: "0%", positive: true }}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une salle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classrooms Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredClassrooms.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune salle trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Bâtiment</TableHead>
                  <TableHead>Étage</TableHead>
                  <TableHead className="text-center">Capacité</TableHead>
                  <TableHead>Équipements</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClassrooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      {room.building ? (
                        <Badge variant="outline">{room.building}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {room.floor !== null ? `Étage ${room.floor}` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{room.capacity || 30} places</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.equipment?.slice(0, 3).map((eq, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                        {(room.equipment?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(room.equipment?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditClassroom(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteClassroom(room)}
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
      <EditClassroomDialog
        classroom={editClassroom}
        open={!!editClassroom}
        onOpenChange={(open) => !open && setEditClassroom(null)}
        onSuccess={refetch}
      />
      <DeleteClassroomDialog
        classroom={deleteClassroom}
        open={!!deleteClassroom}
        onOpenChange={(open) => !open && setDeleteClassroom(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
