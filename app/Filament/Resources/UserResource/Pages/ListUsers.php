<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use App\Models\Role;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
            Actions\CreateAction::make('createComptable')
                ->label('Créer un comptable')
                ->icon('heroicon-o-briefcase')
                ->mutateFormDataUsing(function (array $data): array {
                    $roleId = Role::query()->where('name', 'comptable')->value('id');
                    if ($roleId) {
                        $data['roles'] = array_unique(array_merge($data['roles'] ?? [], [$roleId]));
                    }
                    return $data;
                }),
            Actions\CreateAction::make('createEnseignant')
                ->label('Créer un enseignant')
                ->icon('heroicon-o-user-group')
                ->mutateFormDataUsing(function (array $data): array {
                    $roleId = Role::query()->where('name', 'enseignant')->value('id');
                    if ($roleId) {
                        $data['roles'] = array_unique(array_merge($data['roles'] ?? [], [$roleId]));
                    }
                    return $data;
                }),
            Actions\CreateAction::make('createEleve')
                ->label('Créer un élève')
                ->icon('heroicon-o-academic-cap')
                ->mutateFormDataUsing(function (array $data): array {
                    $roleId = Role::query()->where('name', 'eleve')->value('id');
                    if ($roleId) {
                        $data['roles'] = array_unique(array_merge($data['roles'] ?? [], [$roleId]));
                    }
                    return $data;
                }),
            Actions\CreateAction::make('createParent')
                ->label('Créer un parent')
                ->icon('heroicon-o-user')
                ->mutateFormDataUsing(function (array $data): array {
                    $roleId = Role::query()->where('name', 'parent')->value('id');
                    if ($roleId) {
                        $data['roles'] = array_unique(array_merge($data['roles'] ?? [], [$roleId]));
                    }
                    return $data;
                }),
        ];
    }
}
