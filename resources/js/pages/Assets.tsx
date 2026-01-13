import { useState, useEffect } from "react";
import { laravelAssetsApi } from "@/services/laravelSchoolApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AddAssetDialog } from "@/components/assets/AddAssetDialog";
import { EditAssetDialog } from "@/components/assets/EditAssetDialog";
import { DeleteAssetDialog } from "@/components/assets/DeleteAssetDialog";
import { ActionTooltip } from "@/components/ui/ActionTooltip";
import { formatAmount } from "@/lib/financeUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusSoftClass } from "@/lib/statusMap";

type AssetCategory = "mobilier" | "informatique" | "pedagogique" | "sportif" | "vehicule" | "autre";
type AssetStatus = "actif" | "panne" | "vendu";

interface Asset {
  id: string | number;
  name: string;
  description: string | null;
  category: AssetCategory;
  status: AssetStatus;
  acquisition_date: string | null;
  acquisition_value: number | null;
  current_value: number | null;
  location: string | null;
  serial_number: string | null;
  supplier: string | null;
  warranty_end_date: string | null;
  notes: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  mobilier: "Mobilier",
  informatique: "Informatique",
  pedagogique: "Pédagogique",
  sportif: "Sportif",
  vehicule: "Véhicule",
  autre: "Autre",
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  actif: "Actif",
  panne: "En panne",
  vendu: "Vendu",
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  actif: getStatusSoftClass("success"),
  panne: getStatusSoftClass("warning"),
  vendu: getStatusSoftClass("neutral"),
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await laravelAssetsApi.getAll();
      setAssets((data || []) as Asset[]);
    } catch (error: any) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les actifs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: assets.length,
    totalValue: assets.reduce((sum, a) => sum + (a.acquisition_value || 0), 0),
    functional: assets.filter((a) => a.status === "actif").length,
    needsAttention: assets.filter((a) => a.status === "panne").length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold tracking-tight">Gestion des Actifs</h1>
          <p className="text-muted-foreground">
            Inventaire et suivi des équipements de l'établissement
          </p>
        </div>
        <ActionTooltip tooltipKey="addAsset">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel actif
          </Button>
        </ActionTooltip>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total actifs"
          value={stats.total}
          icon={Package}
        />
        <StatsCard
          title="Valeur totale"
          value={formatAmount(stats.totalValue, "XOF")}
          icon={Package}
        />
        <StatsCard
          title="Fonctionnels"
          value={stats.functional}
          icon={Package}
        />
        <StatsCard
          title="À surveiller"
          value={stats.needsAttention}
          icon={Package}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, description, lieu..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="État" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous états</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Valeur d'acquisition</TableHead>
                  <TableHead>Date d'acquisition</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="mx-auto flex flex-col items-center gap-3 ui-empty-state rounded-xl p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full ui-empty-state-icon">
                          <Package className="h-6 w-6" />
                        </div>
                        <span>Aucun actif trouvé</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{asset.name}</p>
                          {asset.serial_number && (
                            <p className="text-xs text-muted-foreground">
                              N° {asset.serial_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[asset.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[asset.status]}>
                          {STATUS_LABELS[asset.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.location || "-"}</TableCell>
                      <TableCell>
                        {asset.acquisition_value
                          ? formatAmount(asset.acquisition_value, "XOF")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {asset.acquisition_date
                          ? new Date(asset.acquisition_date).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <ActionTooltip tooltipKey="editAsset">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditAsset(asset)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip tooltipKey="deleteAsset">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteAsset(asset)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddAssetDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchAssets}
      />
      {editAsset && (
        <EditAssetDialog
          open={!!editAsset}
          onOpenChange={(open) => !open && setEditAsset(null)}
          asset={editAsset}
          onSuccess={fetchAssets}
        />
      )}
      {deleteAsset && (
        <DeleteAssetDialog
          open={!!deleteAsset}
          onOpenChange={(open) => !open && setDeleteAsset(null)}
          asset={deleteAsset}
          onSuccess={fetchAssets}
        />
      )}
    </div>
  );
}
