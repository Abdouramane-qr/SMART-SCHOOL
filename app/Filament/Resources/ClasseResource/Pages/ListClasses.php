<?php

namespace App\Filament\Resources\ClasseResource\Pages;

use App\Filament\Resources\ClasseResource;
use App\Services\ImportExportService;
use Filament\Actions;
use Filament\Forms\Components\FileUpload;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListClasses extends ListRecords
{
    protected static string $resource = ClasseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('exportCsv')
                ->label('Exporter CSV')
                ->action(fn () => $this->export('csv')),
            Actions\Action::make('templateCsv')
                ->label('Modèle CSV')
                ->action(fn () => $this->export('csv', true)),
            Actions\Action::make('exportExcel')
                ->label('Exporter Excel')
                ->action(fn () => $this->export('xls')),
            Actions\Action::make('importCsv')
                ->label('Importer CSV')
                ->form([
                    FileUpload::make('file')
                        ->label('Fichier CSV')
                        ->acceptedFileTypes(['text/csv', 'text/plain', 'application/vnd.ms-excel'])
                        ->required(),
                ])
                ->action(function (array $data): void {
                    $schoolId = auth()->user()?->school_id;
                    if (! $schoolId) {
                        Notification::make()
                            ->danger()
                            ->title('school_id requis')
                            ->send();
                        return;
                    }

                    $file = $data['file'];
                    $summary = app(ImportExportService::class)->importClasses($file->getRealPath(), $schoolId);
                    $errorCount = count($summary['errors'] ?? []);

                    Notification::make()
                        ->success()
                        ->title('Import terminé')
                        ->body("Ajoutées: {$summary['imported']} • MàJ: {$summary['updated']}")
                        ->send();

                    if ($errorCount > 0) {
                        Notification::make()
                            ->danger()
                            ->title("{$errorCount} ligne(s) en erreur")
                            ->send();
                    }
                }),
            Actions\CreateAction::make(),
        ];
    }

    private function export(string $format, bool $template = false)
    {
        $schoolId = auth()->user()?->school_id;
        if (! $schoolId) {
            Notification::make()->danger()->title('school_id requis')->send();
            return null;
        }

        [$headers, $rows] = app(ImportExportService::class)->exportClasses($schoolId);
        if ($template) {
            $rows = [];
        }
        $filename = sprintf(
            'classes-%s%s.%s',
            now()->format('Ymd-His'),
            $template ? '-template' : '',
            $format === 'csv' ? 'csv' : 'xls'
        );

        return response()->streamDownload(function () use ($headers, $rows, $format) {
            if ($format === 'csv') {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers, ';');
                foreach ($rows as $row) {
                    fputcsv($handle, $row, ';');
                }
                fclose($handle);
                return;
            }

            echo '<table border="1"><thead><tr>';
            foreach ($headers as $header) {
                echo '<th>'.htmlspecialchars((string) $header).'</th>';
            }
            echo '</tr></thead><tbody>';
            foreach ($rows as $row) {
                echo '<tr>';
                foreach ($row as $cell) {
                    echo '<td>'.htmlspecialchars((string) $cell).'</td>';
                }
                echo '</tr>';
            }
            echo '</tbody></table>';
        }, $filename, [
            'Content-Type' => $format === 'csv'
                ? 'text/csv; charset=UTF-8'
                : 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }
}
