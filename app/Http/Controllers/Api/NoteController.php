<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NoteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id');
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;

        $studentIds = collect(explode(',', (string) $request->string('student_ids')))
            ->map(fn ($value) => (int) trim($value))
            ->filter();
        $keyParts = [$perPage, $page, $request->integer('eleve_id'), $request->integer('matiere_id')];
        if ($studentIds->isNotEmpty()) {
            $keyParts[] = $studentIds->implode(',');
        }
        $key = CacheKey::key('notes:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $studentIds) {
            $query = Note::query()
                ->with(['eleve', 'matiere', 'classe', 'academicYear', 'school'])
                ->orderByDesc('id');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($request->filled('academic_year_id')) {
                $query->where('academic_year_id', $request->integer('academic_year_id'));
            }

            if ($request->filled('eleve_id')) {
                $query->where('eleve_id', $request->integer('eleve_id'));
            }

            if ($studentIds->isNotEmpty()) {
                $query->whereIn('eleve_id', $studentIds->all());
            }

            if ($request->filled('matiere_id')) {
                $query->where('matiere_id', $request->integer('matiere_id'));
            }

            return $query->paginate($perPage);
        });

        return NoteResource::collection($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'eleve_id' => ['required', 'integer', 'exists:eleves,id'],
            'matiere_id' => ['required', 'integer', 'exists:matieres,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'value' => ['required', 'numeric'],
            'term' => ['required', 'string', 'max:50'],
            'grade_type' => ['nullable', 'string', 'max:50'],
            'weight' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'evaluation_date' => ['nullable', 'date'],
        ]);

        if (empty($validated['school_id'])) {
            if (! empty($validated['class_id'])) {
                $classe = \App\Models\Classe::query()->find($validated['class_id']);
                if ($classe) {
                    $validated['school_id'] = $classe->school_id;
                }
            }

            if (empty($validated['school_id'])) {
                $eleve = \App\Models\Eleve::query()->find($validated['eleve_id']);
                if ($eleve) {
                    $validated['school_id'] = $eleve->school_id;
                }
            }
        }

        $note = Note::create($validated);
        Cache::tags(CacheKey::tags($note->school_id, $note->academic_year_id))->flush();

        return new NoteResource($note->load(['eleve', 'matiere', 'classe', 'academicYear', 'school']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Note $note)
    {
        $schoolId = $note->school_id;
        $academicYearId = $note->academic_year_id;
        $key = CacheKey::key('notes:show', $schoolId, $academicYearId, [$note->id]);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $resource = $cache->remember($key, now()->addMinutes(5), function () use ($note) {
            return $note->load(['eleve', 'matiere', 'classe', 'academicYear', 'school']);
        });

        return new NoteResource($resource);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Note $note)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'eleve_id' => ['sometimes', 'integer', 'exists:eleves,id'],
            'matiere_id' => ['sometimes', 'integer', 'exists:matieres,id'],
            'class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'value' => ['sometimes', 'numeric'],
            'term' => ['sometimes', 'string', 'max:50'],
            'grade_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'weight' => ['sometimes', 'nullable', 'numeric'],
            'description' => ['sometimes', 'nullable', 'string'],
            'evaluation_date' => ['sometimes', 'nullable', 'date'],
        ]);

        $note->update($validated);
        Cache::tags(CacheKey::tags($note->school_id, $note->academic_year_id))->flush();

        return new NoteResource($note->load(['eleve', 'matiere', 'classe', 'academicYear', 'school']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Note $note)
    {
        $schoolId = $note->school_id;
        $academicYearId = $note->academic_year_id;
        $note->delete();

        Cache::tags(CacheKey::tags($schoolId, $academicYearId))->flush();

        return response()->noContent();
    }
}
