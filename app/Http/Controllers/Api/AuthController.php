<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['data' => null], 200);
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'full_name' => $user->full_name ?? $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            ],
        ]);
    }
}
