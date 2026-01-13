<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Role::class);
        $roles = Role::query()->orderBy('name')->pluck('name')->values();

        return response()->json(['data' => $roles]);
    }
}
