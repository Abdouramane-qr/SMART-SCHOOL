<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportExportService;
use App\Support\SchoolResolver;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    private const ROLES_ALLOWED = ['super_admin', 'admin', 'admin_ecole', 'comptable'];

    public function exportStudents(Request $request): StreamedResponse
    {
        $schoolId = $this->schoolId($request);
        [$headers, $rows] = app(ImportExportService::class)->exportStudents($schoolId);
        return $this->exportResponse($request, 'eleves', $headers, $rows);
    }

    public function exportClasses(Request $request): StreamedResponse
    {
        $schoolId = $this->schoolId($request);
        [$headers, $rows] = app(ImportExportService::class)->exportClasses($schoolId);
        return $this->exportResponse($request, 'classes', $headers, $rows);
    }

    public function exportSubjects(Request $request): StreamedResponse
    {
        $schoolId = $this->schoolId($request);
        [$headers, $rows] = app(ImportExportService::class)->exportSubjects($schoolId);
        return $this->exportResponse($request, 'matieres', $headers, $rows);
    }

    public function exportNotes(Request $request): StreamedResponse
    {
        $schoolId = $this->schoolId($request);
        [$headers, $rows] = app(ImportExportService::class)->exportNotes($schoolId);
        return $this->exportResponse($request, 'notes', $headers, $rows);
    }

    public function importStudents(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $file = $this->requireFile($request);
        $summary = app(ImportExportService::class)->importStudents($file->getRealPath(), $schoolId, $request->user());

        return response()->json(['data' => $summary]);
    }

    public function importClasses(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $file = $this->requireFile($request);
        $summary = app(ImportExportService::class)->importClasses($file->getRealPath(), $schoolId);

        return response()->json(['data' => $summary]);
    }

    public function importSubjects(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $file = $this->requireFile($request);
        $summary = app(ImportExportService::class)->importSubjects($file->getRealPath(), $schoolId);

        return response()->json(['data' => $summary]);
    }

    public function importNotes(Request $request)
    {
        $schoolId = $this->schoolId($request);
        $file = $this->requireFile($request);
        $summary = app(ImportExportService::class)->importNotes($file->getRealPath(), $schoolId);

        return response()->json(['data' => $summary]);
    }

    private function schoolId(Request $request): int
    {
        $user = $request->user();
        if (! $user || ! $user->hasAnyRole(self::ROLES_ALLOWED)) {
            abort(403, 'Accès refusé.');
        }

        return SchoolResolver::requireActiveId();
    }

    private function requireFile(Request $request): UploadedFile
    {
        $file = $request->file('file');
        if (! $file) {
            abort(422, 'Fichier manquant.');
        }

        return $file;
    }

    private function exportResponse(Request $request, string $basename, array $headers, array $rows): StreamedResponse
    {
        $format = strtolower((string) $request->query('format', 'csv'));
        if (! in_array($format, ['csv', 'xls', 'xlsx'], true)) {
            $format = 'csv';
        }

        $isTemplate = $request->boolean('template', false);
        if ($isTemplate) {
            $rows = [];
        }

        $filename = sprintf(
            '%s-%s%s.%s',
            $basename,
            now()->format('Ymd-His'),
            $isTemplate ? '-template' : '',
            $format === 'csv' ? 'csv' : 'xls'
        );

        if ($format === 'csv') {
            return response()->streamDownload(function () use ($headers, $rows) {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers, ';');
                foreach ($rows as $row) {
                    fputcsv($handle, $row, ';');
                }
                fclose($handle);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        return response()->streamDownload(function () use ($headers, $rows) {
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
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }
}
