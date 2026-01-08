<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceService;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function stats(Request $request, FinanceService $financeService)
    {
        $schoolId = $request->integer('school_id');
        $academicYearId = $request->integer('academic_year_id');

        $data = $financeService->getStats($schoolId, $academicYearId);

        return response()->json(['data' => $data]);
    }
}
