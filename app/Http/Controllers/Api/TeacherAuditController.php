<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherAuditResource;
use App\Models\TeacherAudit;
use Illuminate\Http\Request;

class TeacherAuditController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->integer('teacher_id');
        if (! $teacherId) {
            return response()->json(['data' => []]);
        }

        $logs = TeacherAudit::query()
            ->with('changer')
            ->where('teacher_id', $teacherId)
            ->orderByDesc('changed_at')
            ->get();

        return TeacherAuditResource::collection($logs);
    }
}
