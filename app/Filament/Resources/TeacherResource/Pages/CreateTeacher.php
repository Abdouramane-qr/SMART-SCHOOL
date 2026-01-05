<?php

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Filament\Resources\TeacherResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateTeacher extends CreateRecord
{
    protected static string $resource = TeacherResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (empty($data['user_id']) && ! empty($data['email'])) {
            $user = User::where('email', $data['email'])->first();
            if (! $user) {
                $fullName = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
                $password = $data['account_password'] ?? Str::random(12);

                $user = User::create([
                    'name' => $fullName ?: $data['email'],
                    'full_name' => $fullName ?: $data['email'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'password' => Hash::make($password),
                ]);

                $user->assignRole('enseignant');
            } elseif (! $user->hasRole('enseignant')) {
                $user->assignRole('enseignant');
            }

            $data['user_id'] = $user->id;
        }

        unset($data['account_password']);

        return $data;
    }
}
