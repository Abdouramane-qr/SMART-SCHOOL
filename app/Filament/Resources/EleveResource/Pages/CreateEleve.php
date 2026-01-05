<?php

namespace App\Filament\Resources\EleveResource\Pages;

use App\Filament\Resources\EleveResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateEleve extends CreateRecord
{
    protected static string $resource = EleveResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (empty($data['user_id']) && ! empty($data['account_email'])) {
            $user = User::where('email', $data['account_email'])->first();
            if (! $user) {
                $fullName = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
                $password = $data['account_password'] ?? Str::random(12);

                $user = User::create([
                    'name' => $fullName ?: $data['account_email'],
                    'full_name' => $fullName ?: $data['account_email'],
                    'email' => $data['account_email'],
                    'phone' => $data['parent_phone'] ?? null,
                    'password' => Hash::make($password),
                ]);

                $user->assignRole('eleve');
            } elseif (! $user->hasRole('eleve')) {
                $user->assignRole('eleve');
            }

            $data['user_id'] = $user->id;
        }

        unset($data['account_email'], $data['account_password']);

        return $data;
    }
}
