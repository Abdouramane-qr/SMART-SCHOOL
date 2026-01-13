<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Services\AssetService;
use App\Support\CacheKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AssetController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Asset::class, 'asset');
    }

    public function index(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $perPage = $request->integer('per_page') ?: 15;
        $page = $request->integer('page') ?: 1;
        $status = trim((string) $request->string('status'));

        $keyParts = [$perPage, $page, $status ?: null];
        $key = CacheKey::key('assets:index', $schoolId, null, $keyParts);
        $tags = CacheKey::tags($schoolId, null);
        $cache = $tags ? Cache::tags($tags) : Cache::store();

        $result = $cache->remember($key, now()->addMinutes(5), function () use ($perPage, $status, $schoolId) {
            $query = Asset::query()->orderByDesc('created_at');

            if ($schoolId) {
                $query->where('school_id', $schoolId);
            }

            if ($status !== '') {
                $query->where('status', $status);
            }

            return $query->paginate($perPage);
        });

        return AssetResource::collection($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:actif,panne,vendu'],
            'acquisition_date' => ['nullable', 'date'],
            'acquisition_value' => ['nullable', 'numeric', 'min:0'],
            'current_value' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'warranty_end_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        $validated['created_by'] = $request->user()?->id;

        $asset = app(AssetService::class)->create($validated);

        return new AssetResource($asset);
    }

    public function show(Asset $asset)
    {
        return new AssetResource($asset);
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'category' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'nullable', 'string', 'in:actif,panne,vendu'],
            'acquisition_date' => ['sometimes', 'nullable', 'date'],
            'acquisition_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'current_value' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'supplier' => ['sometimes', 'nullable', 'string', 'max:255'],
            'warranty_end_date' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $schoolId = $this->resolveSchoolId($request);
        $validated['school_id'] = $schoolId;

        $asset = app(AssetService::class)->update($asset, $validated);

        return new AssetResource($asset);
    }

    public function destroy(Asset $asset)
    {
        app(AssetService::class)->delete($asset);

        return response()->noContent();
    }
}
