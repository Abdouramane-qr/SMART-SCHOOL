<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceSetting;
use Illuminate\Http\Request;

class FinanceSettingController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->integer('school_id');

        $query = FinanceSetting::query();
        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        return response()->json([
            'data' => $query->get(['setting_key', 'setting_value']),
        ]);
    }
}
