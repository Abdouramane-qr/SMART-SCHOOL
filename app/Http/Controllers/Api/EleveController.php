<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EleveResource;
use App\Models\Classe;
use App\Models\Eleve;
use Illuminate\Http\Request;

class EleveController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Eleve::class, 'eleve');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $academicYearId = $request->integer('academic_year_id');
        $user = $request->user();
        $teacherClassIds = [];
        if ($user?->hasRole('enseignant')) {
            $teacherClassIds = $user->teacherClassIds();
            if (empty($teacherClassIds)) {
                $teacherClassIds = [0];
            }
        }
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;

        $parentEmail = trim((string) $request->string('parent_email'));
        $resolver = function () use ($request, $perPage, $parentEmail, $teacherClassIds, $schoolId) {
            $query = Eleve::query()
                ->select([
                    'eleves.id',
                    'eleves.school_id',
                    'eleves.classe_id',
                    'eleves.student_id',
                    'eleves.full_name',
                    'eleves.first_name',
                    'eleves.last_name',
                    'eleves.gender',
                    'eleves.birth_date',
                    'eleves.address',
                    'eleves.user_id',
                    'eleves.parent_name',
                    'eleves.parent_phone',
                    'eleves.parent_email',
                    'eleves.created_at',
                    'eleves.updated_at',
                ])
                ->selectSub(function ($query) {
                    $query
                        ->from('paiements')
                        ->selectRaw('COALESCE(SUM(amount), 0)')
                        ->whereColumn('paiements.eleve_id', 'eleves.id');
                }, 'total_due')
                ->selectSub(function ($query) {
                    $query
                        ->from('paiements')
                        ->selectRaw('COALESCE(SUM(COALESCE(paid_amount, amount)), 0)')
                        ->whereColumn('paiements.eleve_id', 'eleves.id');
                }, 'total_paid')
                ->with([
                    'classe:id,name,level,academic_year_id',
                ])
                ->orderBy('last_name')
                ->orderBy('first_name');

            if ($schoolId) {
                $query->where('school_id', $schoolId);
            }

            if ($request->filled('academic_year_id')) {
                $query->whereHas('classe', function ($builder) use ($request) {
                    $builder->where('academic_year_id', $request->integer('academic_year_id'));
                });
            }

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->integer('user_id'));
            }

            if ($request->filled('class_id')) {
                $query->where('classe_id', $request->integer('class_id'));
            }

            if (! empty($teacherClassIds)) {
                $query->whereIn('classe_id', $teacherClassIds);
            }

            if ($parentEmail !== '') {
                $query->where('parent_email', $parentEmail);
            }

            if ($request->filled('q')) {
                $q = $request->string('q');
                $query->where(function ($builder) use ($q) {
                    $builder
                        ->where('first_name', 'ilike', "%{$q}%")
                        ->orWhere('last_name', 'ilike', "%{$q}%")
                        ->orWhere('student_id', 'ilike', "%{$q}%");
                });
            }

            return $query->paginate($perPage);
        };

        return EleveResource::collection($resolver());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'classe_id' => ['required', 'integer', 'exists:classes,id'],
            'student_id' => ['nullable', 'string', 'max:50'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:10'],
            'birth_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:255'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'parent_name' => ['nullable', 'string', 'max:100'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'parent_email' => ['nullable', 'email', 'max:255'],
        ], [
            'classe_id.required' => 'La classe est obligatoire.',
            'first_name.required' => 'Le prenom est obligatoire.',
            'birth_date.date' => 'La date de naissance est invalide.',
            'parent_email.email' => "L'email du parent est invalide.",
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        if (empty($validated['school_id'])) {
            $classe = Classe::find($validated['classe_id']);
            $validated['school_id'] = $classe?->school_id;
        }

        if (empty($validated['full_name'])) {
            $validated['full_name'] = trim(($validated['first_name'] ?? '').' '.($validated['last_name'] ?? ''));
        }

        if (empty($validated['student_id'])) {
            unset($validated['student_id']);
        }

        $eleve = Eleve::create($validated);
        return new EleveResource($eleve->load(['classe', 'paiements', 'school']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Eleve $eleve)
    {
        $user = request()->user();
        if ($user?->hasRole('enseignant')) {
            $classId = $eleve->classe_id;
            if ($classId && ! in_array($classId, $user->teacherClassIds(), true)) {
                return response()->json(['message' => 'Accès refusé à cet élève.'], 403);
            }
        }

        $resolver = function () use ($eleve) {
            return $eleve->load(['classe', 'paiements', 'school']);
        };
        return new EleveResource($resolver());
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Eleve $eleve)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'classe_id' => ['sometimes', 'integer', 'exists:classes,id'],
            'student_id' => ['sometimes', 'nullable', 'string', 'max:50'],
            'full_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:10'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'parent_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'parent_email' => ['sometimes', 'nullable', 'email', 'max:255'],
        ], [
            'birth_date.date' => 'La date de naissance est invalide.',
            'parent_email.email' => "L'email du parent est invalide.",
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        $user = $request->user();
        if ($user?->hasRole('enseignant')) {
            $classId = $validated['classe_id'] ?? $eleve->classe_id;
            if ($classId && ! in_array($classId, $user->teacherClassIds(), true)) {
                return response()->json(['message' => 'Accès refusé à cet élève.'], 403);
            }
        }

        if (array_key_exists('classe_id', $validated) && empty($validated['school_id'])) {
            $classe = Classe::find($validated['classe_id']);
            $validated['school_id'] = $classe?->school_id;
        }

        if (array_key_exists('full_name', $validated) && empty($validated['full_name'])) {
            $validated['full_name'] = trim(($validated['first_name'] ?? $eleve->first_name).' '.($validated['last_name'] ?? $eleve->last_name));
        }

        if (array_key_exists('student_id', $validated) && empty($validated['student_id'])) {
            unset($validated['student_id']);
        }

        $eleve->update($validated);
        return new EleveResource($eleve->load(['classe', 'paiements', 'school']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Eleve $eleve)
    {
        $user = request()->user();
        if ($user?->hasRole('enseignant')) {
            $classId = $eleve->classe_id;
            if ($classId && ! in_array($classId, $user->teacherClassIds(), true)) {
                return response()->json(['message' => 'Accès refusé à cet élève.'], 403);
            }
        }

        $schoolId = $eleve->school_id;
        $academicYearId = $eleve->classe?->academic_year_id;
        $eleve->delete();

        return response()->noContent();
    }
}
