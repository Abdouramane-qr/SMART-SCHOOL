<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentAuditResource;
use App\Models\AuditLog;
use App\Models\Eleve;
use Illuminate\Http\Request;

class StudentAuditController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Eleve::class);
        $studentId = $request->integer('student_id') ?: $request->integer('eleve_id');
        if (! $studentId) {
            return response()->json(['data' => []]);
        }

        $schoolId = $this->resolveSchoolId($request);
        $studentSchoolId = Eleve::query()->whereKey($studentId)->value('school_id');
        if ($studentSchoolId && $studentSchoolId !== $schoolId) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $logs = AuditLog::query()
            ->with('user')
            ->where('entity_id', $studentId)
            ->whereIn('entity_type', ['eleve', 'eleves', 'student', 'students'])
            ->orderByDesc('created_at')
            ->get();

        return StudentAuditResource::collection($logs);
    }
}
