<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaiementResource;
use App\Models\Eleve;
use App\Models\Paiement;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PaiementController extends Controller
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
        $status = trim((string) $request->string('status'));
        $method = trim((string) $request->string('method'));

        $keyParts = [$perPage, $page, $status ?: null, $method ?: null, $request->integer('eleve_id')];
        $key = CacheKey::key('paiements:index', $schoolId, $academicYearId, $keyParts);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($request, $perPage, $status, $method) {
            $query = Paiement::query()
                ->select([
                    'paiements.id',
                    'paiements.school_id',
                    'paiements.eleve_id',
                    'paiements.amount',
                    'paiements.paid_amount',
                    'paiements.payment_date',
                    'paiements.due_date',
                    'paiements.method',
                    'paiements.payment_type',
                    'paiements.status',
                    'paiements.notes',
                    'paiements.receipt_number',
                    'paiements.created_at',
                    'paiements.updated_at',
                ])
                ->with(['eleve:id,first_name,last_name,full_name,student_id'])
                ->orderByDesc('payment_date')
                ->orderByDesc('id');

            if ($request->filled('school_id')) {
                $query->where('school_id', $request->integer('school_id'));
            }

            if ($request->filled('academic_year_id')) {
                $yearId = $request->integer('academic_year_id');
                $query->whereHas('eleve.classe', function ($builder) use ($yearId) {
                    $builder->where('academic_year_id', $yearId);
                });
            }

            if ($request->filled('eleve_id')) {
                $query->where('eleve_id', $request->integer('eleve_id'));
            }

            if ($status !== '') {
                $query->where('status', $status);
            }

            if ($method !== '') {
                $query->where(function ($builder) use ($method) {
                    $builder
                        ->where('method', $method)
                        ->orWhere('payment_type', $method);
                });
            }

            return $query->paginate($perPage);
        });

        return PaiementResource::collection($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'eleve_id' => ['required', 'integer', 'exists:eleves,id'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'method' => ['nullable', 'string', 'max:50'],
            'payment_type' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);
        $payload = $validated;
        $payload['school_id'] = $payload['school_id'] ?? $eleve->school_id;
        $payload['method'] = $payload['method'] ?? $payload['payment_type'];

        if (! array_key_exists('amount', $payload) || $payload['amount'] === null) {
            $payload['amount'] = $payload['paid_amount'] ?? 0;
        }

        $paiement = Paiement::create($payload);
        Cache::tags(CacheKey::tags($paiement->school_id, $eleve->classe?->academic_year_id))->flush();

        return new PaiementResource($paiement->load(['eleve', 'school']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Paiement $paiement)
    {
        $schoolId = $paiement->school_id;
        $academicYearId = $paiement->eleve?->classe?->academic_year_id;
        $key = CacheKey::key('paiements:show', $schoolId, $academicYearId, [$paiement->id]);
        $tags = CacheKey::tags($schoolId, $academicYearId);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $resource = $cache->remember($key, now()->addMinutes(5), function () use ($paiement) {
            return $paiement->load(['eleve', 'school']);
        });

        return new PaiementResource($resource);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Paiement $paiement)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'eleve_id' => ['sometimes', 'integer', 'exists:eleves,id'],
            'amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'paid_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'payment_date' => ['sometimes', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'method' => ['sometimes', 'nullable', 'string', 'max:50'],
            'payment_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'receipt_number' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        if (array_key_exists('eleve_id', $validated) && empty($validated['school_id'])) {
            $eleve = Eleve::find($validated['eleve_id']);
            $validated['school_id'] = $eleve?->school_id;
        }

        if (array_key_exists('method', $validated) && empty($validated['method']) && ! empty($validated['payment_type'])) {
            $validated['method'] = $validated['payment_type'];
        }

        if (array_key_exists('amount', $validated) && $validated['amount'] === null && isset($validated['paid_amount'])) {
            $validated['amount'] = $validated['paid_amount'];
        }

        $paiement->update($validated);
        $academicYearId = $paiement->eleve?->classe?->academic_year_id;
        Cache::tags(CacheKey::tags($paiement->school_id, $academicYearId))->flush();

        return new PaiementResource($paiement->load(['eleve', 'school']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Paiement $paiement)
    {
        $schoolId = $paiement->school_id;
        $academicYearId = $paiement->eleve?->classe?->academic_year_id;
        $paiement->delete();

        Cache::tags(CacheKey::tags($schoolId, $academicYearId))->flush();

        return response()->noContent();
    }
}
