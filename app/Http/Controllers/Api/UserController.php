<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->orderBy('full_name')
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:50'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'max:50'],
        ]);

        $user = User::create([
            'name' => $validated['full_name'],
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'avatar_url' => $validated['avatar_url'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        if (! empty($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        if (! empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return new UserResource($user);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', 'nullable', 'string', 'max:50'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'max:50'],
        ]);

        if (array_key_exists('full_name', $validated)) {
            $user->full_name = $validated['full_name'];
            $user->name = $validated['full_name'];
        }

        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }

        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }

        if (array_key_exists('address', $validated)) {
            $user->address = $validated['address'];
        }

        if (array_key_exists('avatar_url', $validated)) {
            $user->avatar_url = $validated['avatar_url'];
        }

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if (array_key_exists('roles', $validated)) {
            $user->syncRoles($validated['roles'] ?? []);
        } elseif (array_key_exists('role', $validated)) {
            if ($validated['role']) {
                $user->syncRoles([$validated['role']]);
            } else {
                $user->syncRoles([]);
            }
        }

        return new UserResource($user);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }
}
