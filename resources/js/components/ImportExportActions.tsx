import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { laravelImportExportApi } from "@/services/laravelSchoolApi";
import { downloadBlob } from "@/lib/downloadFile";

type ImportExportEntity = "students" | "classes" | "subjects" | "notes";

interface ImportExportActionsProps {
  entity: ImportExportEntity;
  onImported?: () => void;
}

export function ImportExportActions({ entity, onImported }: ImportExportActionsProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<
    { row: number; message: string }[]
  >([]);

  const handleExport = async (format: "csv" | "xls") => {
    try {
      const { blob, filename } = await laravelImportExportApi.exportEntity(entity, format);
      downloadBlob(blob, filename);
      toast.success("Export terminé");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'export");
    }
  };

  const handleTemplate = async () => {
    try {
      const { blob, filename } = await laravelImportExportApi.exportTemplate(entity);
      downloadBlob(blob, filename);
      toast.success("Modèle CSV téléchargé");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors du téléchargement du modèle");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await laravelImportExportApi.importEntity(entity, file);
      const rawErrors = Array.isArray(result.errors) ? result.errors : [];
      const normalizedErrors = rawErrors.map((error: any, index: number) => {
        if (typeof error === "string") {
          return { row: index + 1, message: error };
        }
        const rowCandidate = error?.row ?? error?.line ?? error?.ligne ?? null;
        const row = Number(rowCandidate);
        const message =
          typeof error?.message === "string" && error.message.trim() !== ""
            ? error.message
            : typeof error?.error === "string" && error.error.trim() !== ""
              ? error.error
              : "Erreur inconnue.";
        return {
          row: Number.isFinite(row) && row > 0 ? row : index + 1,
          message,
        };
      });
      const errorCount = normalizedErrors.length;
      const updated = result.updated || 0;
      toast.success(`Import OK: ${result.imported} ajout(s), ${updated} mise(s) à jour`);
      if (errorCount > 0) {
        setImportErrors(normalizedErrors);
        setIsErrorOpen(true);
        const preview = normalizedErrors
          ?.slice(0, 5)
          .map((error) => `Ligne ${error.row}: ${error.message}`)
          .join("\n");
        const more = errorCount > 5 ? `\n+ ${errorCount - 5} autre(s)` : "";
        toast.error(`${errorCount} ligne(s) en erreur`, {
          description: `${preview || "Voir le fichier source."}${more}`,
        });
      }
      onImported?.();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'import");
    }
  };

  return (
    <>
      <Dialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erreurs d'import</DialogTitle>
          </DialogHeader>
          {importErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune erreur detaillee disponible.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {importErrors.length} ligne(s) en erreur.
              </p>
              <div className="space-y-2">
                {importErrors.map((error, index) => (
                  <div key={`${error.row}-${index}`} className="text-sm">
                    <span className="font-medium">Ligne {error.row}:</span>{" "}
                    <span>{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleImport(file);
            event.target.value = "";
          }
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import / Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importer CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger modèle CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("xls")}>
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
