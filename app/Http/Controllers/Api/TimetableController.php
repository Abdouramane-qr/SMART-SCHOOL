<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TimetableResource;
use App\Models\Classe;
use App\Models\Timetable;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id') ?: $request->integer('school_year_id');
        $perPage = $request->integer('per_page');
        $page = $request->integer('page') ?: 1;

        $keyParts = [$perPage ?: 'all', $page, $request->integer('class_id'), $request->integer('teacher_id')];
        $key = CacheKey::key('timetable:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage) {
            $query = Timetable::query()
                ->with(['classe', 'matiere', 'teacher.user', 'classroom'])
                ->orderBy('day_of_week')
                ->orderBy('start_time');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($request->filled('academic_year_id') || $request->filled('school_year_id')) {
                $query->where('academic_year_id', $request->integer('academic_year_id') ?: $request->integer('school_year_id'));
            }

            if ($request->filled('class_id')) {
                $query->where('class_id', $request->integer('class_id'));
            }

            if ($request->filled('teacher_id')) {
                $query->where('teacher_id', $request->integer('teacher_id'));
            }

            return $perPage ? $query->paginate($perPage) : $query->get();
        });

        return TimetableResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'school_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'matiere_id' => ['nullable', 'integer', 'exists:matieres,id'],
            'subject_id' => ['nullable', 'integer', 'exists:matieres,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:enseignants,id'],
            'classroom_id' => ['nullable', 'integer', 'exists:classrooms,id'],
            'day_of_week' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        if (empty($validated['matiere_id']) && ! empty($validated['subject_id'])) {
            $validated['matiere_id'] = $validated['subject_id'];
        }
        unset($validated['subject_id']);

        if (empty($validated['academic_year_id']) && ! empty($validated['school_year_id'])) {
            $validated['academic_year_id'] = $validated['school_year_id'];
        }
        unset($validated['school_year_id']);

        if (empty($validated['school_id'])) {
            $classe = Classe::query()->find($validated['class_id']);
            if ($classe) {
                $validated['school_id'] = $classe->school_id;
                if (empty($validated['academic_year_id'])) {
                    $validated['academic_year_id'] = $classe->academic_year_id;
                }
            }
        }

        $entry = Timetable::create($validated);
        Cache::tags(CacheKey::tags($entry->school_id, $entry->academic_year_id))->flush();

        return new TimetableResource($entry->load(['classe', 'matiere', 'teacher.user', 'classroom']));
    }

    public function update(Request $request, Timetable $timetable)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'academic_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'school_year_id' => ['sometimes', 'integer', 'exists:academic_years,id'],
            'class_id' => ['sometimes', 'integer', 'exists:classes,id'],
            'matiere_id' => ['sometimes', 'integer', 'exists:matieres,id'],
            'subject_id' => ['sometimes', 'integer', 'exists:matieres,id'],
            'teacher_id' => ['sometimes', 'nullable', 'integer', 'exists:enseignants,id'],
            'classroom_id' => ['sometimes', 'nullable', 'integer', 'exists:classrooms,id'],
            'day_of_week' => ['sometimes', 'integer', 'between:1,7'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
        ]);

        if (array_key_exists('subject_id', $validated) && empty($validated['matiere_id'])) {
            $validated['matiere_id'] = $validated['subject_id'];
        }
        unset($validated['subject_id']);

        if (array_key_exists('school_year_id', $validated) && empty($validated['academic_year_id'])) {
            $validated['academic_year_id'] = $validated['school_year_id'];
        }
        unset($validated['school_year_id']);

        if (array_key_exists('class_id', $validated)) {
            $classe = Classe::query()->find($validated['class_id']);
            if ($classe) {
                $validated['school_id'] = $validated['school_id'] ?? $classe->school_id;
                if (empty($validated['academic_year_id'])) {
                    $validated['academic_year_id'] = $classe->academic_year_id;
                }
            }
        }

        $timetable->update($validated);
        Cache::tags(CacheKey::tags($timetable->school_id, $timetable->academic_year_id))->flush();

        return new TimetableResource($timetable->load(['classe', 'matiere', 'teacher.user', 'classroom']));
    }

    public function destroy(Timetable $timetable)
    {
        $schoolId = $timetable->school_id;
        $academicYearId = $timetable->academic_year_id;
        $timetable->delete();

        Cache::tags(CacheKey::tags($schoolId, $academicYearId))->flush();

        return response()->noContent();
    }
}
