<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['required', 'string', 'max:50'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        if (! $user->hasRole($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        return response()->json(['data' => [
            'user_id' => $user->id,
            'role' => $validated['role'],
        ]]);
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['required', 'string', 'max:50'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $user->removeRole($validated['role']);

        return response()->noContent();
    }
}
