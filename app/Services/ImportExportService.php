<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\User;
use App\Services\GlobalAuditLogger;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ImportExportService
{
    public function exportStudents(int $schoolId): array
    {
        $students = Eleve::query()
            ->with(['classe.academicYear'])
            ->where('school_id', $schoolId)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $headers = [
            'student_id',
            'full_name',
            'first_name',
            'last_name',
            'gender',
            'birth_date',
            'address',
            'parent_name',
            'parent_phone',
            'parent_email',
            'class_name',
            'class_level',
            'academic_year',
        ];

        $rows = $students->map(function (Eleve $eleve) {
            $classe = $eleve->classe;
            return [
                $eleve->student_id,
                $eleve->full_name,
                $eleve->first_name,
                $eleve->last_name,
                $eleve->gender,
                $eleve->birth_date,
                $eleve->address,
                $eleve->parent_name,
                $eleve->parent_phone,
                $eleve->parent_email,
                $classe?->name,
                $classe?->level,
                $classe?->academicYear?->name,
            ];
        })->all();

        return [$headers, $rows];
    }

    public function exportClasses(int $schoolId): array
    {
        $classes = Classe::query()
            ->with('academicYear')
            ->where('school_id', $schoolId)
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        $headers = [
            'name',
            'level',
            'capacity',
            'academic_year',
        ];

        $rows = $classes->map(function (Classe $classe) {
            return [
                $classe->name,
                $classe->level,
                $classe->capacity,
                $classe->academicYear?->name,
            ];
        })->all();

        return [$headers, $rows];
    }

    public function exportSubjects(int $schoolId): array
    {
        $subjects = Matiere::query()
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get();

        $headers = [
            'name',
            'code',
            'coefficient',
        ];

        $rows = $subjects->map(function (Matiere $matiere) {
            return [
                $matiere->name,
                $matiere->code,
                $matiere->coefficient,
            ];
        })->all();

        return [$headers, $rows];
    }

    public function exportNotes(int $schoolId): array
    {
        $notes = Note::query()
            ->with(['eleve', 'matiere', 'classe.academicYear'])
            ->where('school_id', $schoolId)
            ->orderByDesc('id')
            ->get();

        $headers = [
            'student_id',
            'subject_code',
            'term',
            'grade',
            'weight',
            'grade_type',
            'description',
            'evaluation_date',
            'class_name',
            'academic_year',
        ];

        $rows = $notes->map(function (Note $note) {
            return [
                $note->eleve?->student_id,
                $note->matiere?->code,
                $note->term,
                $note->value,
                $note->weight,
                $note->grade_type,
                $note->description,
                $note->evaluation_date,
                $note->classe?->name,
                $note->classe?->academicYear?->name,
            ];
        })->all();

        return [$headers, $rows];
    }

    public function importStudents(string $path, int $schoolId, User $user): array
    {
        [$headers, $rows] = $this->readCsv($path);
        $map = $this->buildHeaderMap($headers, [
            'student_id' => ['student_id', 'matricule', 'id_eleve'],
            'full_name' => ['full_name', 'nom_complet', 'nom complet'],
            'first_name' => ['first_name', 'prenom', 'prénom'],
            'last_name' => ['last_name', 'nom', 'nom_famille'],
            'gender' => ['gender', 'sexe'],
            'birth_date' => ['birth_date', 'date_naissance', 'date_de_naissance'],
            'address' => ['address', 'adresse'],
            'parent_name' => ['parent_name', 'nom_parent', 'tuteur'],
            'parent_phone' => ['parent_phone', 'tel_parent', 'telephone_parent'],
            'parent_email' => ['parent_email', 'email_parent'],
            'class_name' => ['class_name', 'classe', 'class'],
            'class_id' => ['class_id', 'classe_id'],
            'class_level' => ['class_level', 'niveau'],
            'academic_year' => ['academic_year', 'annee_scolaire', 'school_year'],
        ]);

        $summary = ['imported' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $this->mapRow($row, $map);

            $studentId = $this->stringOrNull($data['student_id'] ?? null);
            $firstName = $this->stringOrNull($data['first_name'] ?? null);
            $lastName = $this->stringOrNull($data['last_name'] ?? null);
            $fullName = $this->stringOrNull($data['full_name'] ?? null);

            if (! $firstName && $fullName) {
                [$firstName, $lastName] = $this->splitName($fullName);
            }

            $gender = $this->stringOrNull($data['gender'] ?? null);
            $birthDateRaw = $this->stringOrNull($data['birth_date'] ?? null);
            $birthDate = $this->parseDate($birthDateRaw);
            $classId = null;

            $issues = [];
            if (! $firstName) {
                $issues['first_name'] = 'missing';
            }
            if (! $lastName) {
                $issues['last_name'] = 'missing';
            }
            if (! $gender) {
                $issues['gender'] = 'missing';
            }
            if (! $birthDateRaw) {
                $issues['birth_date'] = 'missing';
            } elseif (! $birthDate) {
                $issues['birth_date'] = 'invalid_date';
            }

            $classIdValue = $this->stringOrNull($data['class_id'] ?? null);
            if ($classIdValue) {
                $classId = (int) $classIdValue;
                $classExists = Classe::query()
                    ->where('school_id', $schoolId)
                    ->whereKey($classId)
                    ->exists();
                if (! $classExists) {
                    $issues['class_id'] = 'class_not_found';
                }
            } else {
                $classId = $this->resolveClassId($schoolId, $data, $rowNumber);
                if (! $classId) {
                    $issues['class_name'] = 'class_not_found';
                }
            }

            if (! empty($issues)) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'code' => 'validation_failed',
                    'message' => "Ligne invalide: verifiez les champs requis.",
                    'fields' => $issues,
                    'input' => [
                        'student_id' => $studentId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'gender' => $gender,
                        'birth_date' => $birthDateRaw,
                        'class_id' => $classIdValue,
                        'class_name' => $this->stringOrNull($data['class_name'] ?? null),
                        'class_level' => $this->stringOrNull($data['class_level'] ?? null),
                        'academic_year' => $this->stringOrNull($data['academic_year'] ?? null),
                    ],
                ];
                continue;
            }

            $payload = [
                'school_id' => $schoolId,
                'classe_id' => $classId,
                'student_id' => $studentId,
                'full_name' => $fullName ?: trim($firstName.' '.$lastName),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'gender' => $gender,
                'birth_date' => $birthDate,
                'address' => $this->stringOrNull($data['address'] ?? null),
                'parent_name' => $this->stringOrNull($data['parent_name'] ?? null),
                'parent_phone' => $this->stringOrNull($data['parent_phone'] ?? null),
                'parent_email' => $this->stringOrNull($data['parent_email'] ?? null),
            ];

            try {
                $existing = $studentId
                    ? Eleve::query()->where('student_id', $studentId)->first()
                    : null;

                if ($existing && (int) $existing->school_id !== $schoolId) {
                    $summary['errors'][] = [
                        'row' => $rowNumber,
                        'code' => 'student_id_conflict',
                        'message' => "Matricule deja utilise dans une autre ecole.",
                        'fields' => ['student_id' => 'conflict'],
                        'input' => ['student_id' => $studentId],
                    ];
                    continue;
                }

                $result = DB::transaction(function () use ($existing, $payload) {
                    if ($existing) {
                        $updated = $existing->update(Arr::except($payload, ['student_id']));
                        if (! $updated) {
                            throw new RuntimeException("Echec de mise a jour de l'eleve.");
                        }
                        return 'updated';
                    }

                    $created = Eleve::create($payload);
                    if (! $created->exists) {
                        throw new RuntimeException("Echec de creation de l'eleve.");
                    }
                    return 'imported';
                });

                if ($result === 'updated') {
                    $summary['updated']++;
                } else {
                    $summary['imported']++;
                }
            } catch (\Throwable $e) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'code' => 'exception',
                    'message' => $e->getMessage(),
                    'fields' => [],
                    'input' => [
                        'student_id' => $studentId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                    ],
                ];
            }
        }

        GlobalAuditLogger::log('import', 'students', [
            'school_id' => $schoolId,
            'rows' => count($rows),
            'imported' => $summary['imported'],
            'updated' => $summary['updated'],
            'errors_count' => count($summary['errors']),
        ]);

        return $summary;
    }

    public function importClasses(string $path, int $schoolId): array
    {
        [$headers, $rows] = $this->readCsv($path);
        $map = $this->buildHeaderMap($headers, [
            'name' => ['name', 'classe', 'class_name'],
            'level' => ['level', 'niveau'],
            'capacity' => ['capacity', 'capacite', 'capacité'],
            'academic_year' => ['academic_year', 'annee_scolaire', 'school_year'],
        ]);

        $summary = ['imported' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $this->mapRow($row, $map);
            $name = $this->stringOrNull($data['name'] ?? null);
            if (! $name) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => 'Nom de classe manquant.',
                ];
                continue;
            }

            $academicYearId = $this->resolveAcademicYearId($schoolId, $data['academic_year'] ?? null);
            if (! $academicYearId) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => "Année scolaire introuvable pour la classe {$name}.",
                ];
                continue;
            }

            $payload = [
                'school_id' => $schoolId,
                'academic_year_id' => $academicYearId,
                'name' => $name,
                'level' => $this->stringOrNull($data['level'] ?? null),
                'capacity' => $this->numberOrNull($data['capacity'] ?? null),
            ];

            $existing = Classe::query()
                ->where('school_id', $schoolId)
                ->where('academic_year_id', $academicYearId)
                ->where('name', $name)
                ->first();

            if ($existing) {
                $existing->update($payload);
                $summary['updated']++;
            } else {
                Classe::create($payload);
                $summary['imported']++;
            }
        }

        GlobalAuditLogger::log('import', 'classes', [
            'school_id' => $schoolId,
            'rows' => count($rows),
            'imported' => $summary['imported'],
            'updated' => $summary['updated'],
            'errors_count' => count($summary['errors']),
        ]);

        return $summary;
    }

    public function importSubjects(string $path, int $schoolId): array
    {
        [$headers, $rows] = $this->readCsv($path);
        $map = $this->buildHeaderMap($headers, [
            'name' => ['name', 'matiere', 'subject'],
            'code' => ['code', 'subject_code', 'matiere_code'],
            'coefficient' => ['coefficient', 'coef'],
        ]);

        $summary = ['imported' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $this->mapRow($row, $map);
            $name = $this->stringOrNull($data['name'] ?? null);
            $code = $this->stringOrNull($data['code'] ?? null);
            if (! $name || ! $code) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => 'Nom ou code de matière manquant.',
                ];
                continue;
            }

            $payload = [
                'school_id' => $schoolId,
                'name' => $name,
                'code' => $code,
                'coefficient' => $this->numberOrNull($data['coefficient'] ?? null) ?? 1,
            ];

            $existing = Matiere::query()
                ->where('school_id', $schoolId)
                ->where('code', $code)
                ->first();

            if ($existing) {
                $existing->update($payload);
                $summary['updated']++;
            } else {
                Matiere::create($payload);
                $summary['imported']++;
            }
        }

        GlobalAuditLogger::log('import', 'subjects', [
            'school_id' => $schoolId,
            'rows' => count($rows),
            'imported' => $summary['imported'],
            'updated' => $summary['updated'],
            'errors_count' => count($summary['errors']),
        ]);

        return $summary;
    }

    public function importNotes(string $path, int $schoolId): array
    {
        [$headers, $rows] = $this->readCsv($path);
        $map = $this->buildHeaderMap($headers, [
            'student_id' => ['student_id', 'matricule'],
            'subject_code' => ['subject_code', 'code_matiere', 'matiere_code'],
            'term' => ['term', 'trimestre', 'periode'],
            'grade' => ['grade', 'note', 'value'],
            'weight' => ['weight', 'poids'],
            'grade_type' => ['grade_type', 'type'],
            'description' => ['description', 'commentaire'],
            'evaluation_date' => ['evaluation_date', 'date_evaluation'],
            'class_name' => ['class_name', 'classe'],
            'class_id' => ['class_id', 'classe_id'],
            'academic_year' => ['academic_year', 'annee_scolaire', 'school_year'],
        ]);

        $summary = ['imported' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $data = $this->mapRow($row, $map);

            $studentId = $this->stringOrNull($data['student_id'] ?? null);
            $subjectCode = $this->stringOrNull($data['subject_code'] ?? null);
            $term = $this->stringOrNull($data['term'] ?? null);
            $grade = $this->numberOrNull($data['grade'] ?? null);

            if (! $studentId || ! $subjectCode || ! $term || $grade === null) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => 'Champs requis manquants (student_id, subject_code, term, grade).',
                ];
                continue;
            }

            $student = Eleve::query()->where('student_id', $studentId)->first();
            if (! $student) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => "Élève introuvable pour matricule {$studentId}.",
                ];
                continue;
            }

            $subject = Matiere::query()
                ->where('school_id', $schoolId)
                ->where('code', $subjectCode)
                ->first();
            if (! $subject) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => "Matière introuvable pour code {$subjectCode}.",
                ];
                continue;
            }

            $classId = $data['class_id'] ?? null;
            if ($classId) {
                $classId = (int) $classId;
            }
            if (! $classId && ! empty($data['class_name'])) {
                $classId = $this->resolveClassId($schoolId, $data, $rowNumber);
            }
            if (! $classId) {
                $classId = $student->classe_id;
            }

            $academicYearId = $this->resolveAcademicYearId($schoolId, $data['academic_year'] ?? null)
                ?? $student->classe?->academic_year_id;

            $payload = [
                'school_id' => $schoolId,
                'eleve_id' => $student->id,
                'matiere_id' => $subject->id,
                'class_id' => $classId,
                'academic_year_id' => $academicYearId,
                'value' => $grade,
                'term' => $term,
                'weight' => $this->numberOrNull($data['weight'] ?? null),
                'grade_type' => $this->stringOrNull($data['grade_type'] ?? null),
                'description' => $this->stringOrNull($data['description'] ?? null),
                'evaluation_date' => $this->parseDate($data['evaluation_date'] ?? null),
            ];

            try {
                Note::create($payload);
                $summary['imported']++;
            } catch (\Throwable $e) {
                $summary['errors'][] = [
                    'row' => $rowNumber,
                    'message' => $e->getMessage(),
                ];
            }
        }

        GlobalAuditLogger::log('import', 'notes', [
            'school_id' => $schoolId,
            'rows' => count($rows),
            'imported' => $summary['imported'],
            'errors_count' => count($summary['errors']),
        ]);

        return $summary;
    }

    private function readCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if (! $handle) {
            throw new RuntimeException('Impossible de lire le fichier.');
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            throw new RuntimeException('Fichier vide.');
        }

        $delimiter = $this->detectDelimiter($firstLine);
        $headers = str_getcsv($this->stripBom($firstLine), $delimiter);
        $headers = array_map(fn ($header) => trim((string) $header), $headers);

        $rows = [];
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (count($data) === 1 && trim((string) $data[0]) === '') {
                continue;
            }
            $rows[] = $data;
        }
        fclose($handle);

        return [$headers, $rows];
    }

    private function detectDelimiter(string $line): string
    {
        $delimiters = [',' => substr_count($line, ','), ';' => substr_count($line, ';'), "\t" => substr_count($line, "\t")];
        arsort($delimiters);
        return array_key_first($delimiters) ?: ',';
    }

    private function buildHeaderMap(array $headers, array $aliases): array
    {
        $normalized = array_map(fn ($header) => $this->normalizeHeader($header), $headers);
        $map = [];
        foreach ($aliases as $key => $possible) {
            $possible = array_map(fn ($alias) => $this->normalizeHeader($alias), $possible);
            foreach ($normalized as $index => $header) {
                if (in_array($header, $possible, true)) {
                    $map[$key] = $index;
                    break;
                }
            }
        }
        return $map;
    }

    private function mapRow(array $row, array $map): array
    {
        $data = [];
        foreach ($map as $key => $index) {
            $data[$key] = $row[$index] ?? null;
        }
        return $data;
    }

    private function normalizeHeader(string $header): string
    {
        $header = trim(Str::lower($header));
        $header = str_replace([' ', '-', '.'], '_', $header);
        return preg_replace('/[^a-z0-9_]/', '', $header) ?: '';
    }

    private function stripBom(string $value): string
    {
        return preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
    }

    private function stringOrNull(?string $value): ?string
    {
        $value = $value !== null ? trim($value) : null;
        return $value !== '' ? $value : null;
    }

    private function numberOrNull(?string $value): ?float
    {
        $value = $this->stringOrNull($value);
        if ($value === null) {
            return null;
        }
        $value = str_replace(',', '.', $value);
        return is_numeric($value) ? (float) $value : null;
    }

    private function parseDate(?string $value): ?string
    {
        $value = $this->stringOrNull($value);
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $first = array_shift($parts) ?: $fullName;
        $last = trim(implode(' ', $parts));
        if ($last === '') {
            $last = $first;
        }
        return [$first, $last];
    }

    private function resolveAcademicYearId(int $schoolId, ?string $yearName): ?int
    {
        if ($yearName) {
            $year = AcademicYear::query()
                ->where('school_id', $schoolId)
                ->where('name', $yearName)
                ->first();
            if ($year) {
                return $year->id;
            }
        }

        return AcademicYear::query()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->value('id');
    }

    private function resolveClassId(int $schoolId, array $data, int $rowNumber): ?int
    {
        $classId = $data['class_id'] ?? null;
        if ($classId) {
            return (int) $classId;
        }

        $className = $this->stringOrNull($data['class_name'] ?? null);
        if (! $className) {
            return null;
        }

        $query = Classe::query()->where('school_id', $schoolId)->where('name', $className);
        $yearId = $this->resolveAcademicYearId($schoolId, $data['academic_year'] ?? null);
        if ($yearId) {
            $query->where('academic_year_id', $yearId);
        }

        if (! empty($data['class_level'])) {
            $query->where('level', $data['class_level']);
        }

        return $query->value('id');
    }
}
