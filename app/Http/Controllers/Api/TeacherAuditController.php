<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherAuditResource;
use App\Models\Enseignant;
use App\Models\TeacherAudit;
use Illuminate\Http\Request;

class TeacherAuditController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', TeacherAudit::class);
        $teacherId = $request->integer('teacher_id');
        if (! $teacherId) {
            return response()->json(['data' => []]);
        }

        $schoolId = $this->resolveSchoolId($request);
        $teacherSchoolId = Enseignant::query()->whereKey($teacherId)->value('school_id');
        if ($teacherSchoolId && $teacherSchoolId !== $schoolId) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $logs = TeacherAudit::query()
            ->with('changer')
            ->where('teacher_id', $teacherId)
            ->orderByDesc('changed_at')
            ->get();

        return TeacherAuditResource::collection($logs);
    }
}
