<?php

namespace App\Filament\Pages;

use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\ParentModel;
use Filament\Pages\Page;

class MissingAccounts extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-user-minus';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Comptes manquants';
    protected static ?string $slug = 'comptes-manquants';

    protected static string $view = 'filament.pages.missing-accounts';

    public function getViewData(): array
    {
        return [
            'elevesMissing' => Eleve::query()->whereNull('user_id')->count(),
            'teachersMissing' => Enseignant::query()->whereNull('user_id')->count(),
            'parentsMissing' => ParentModel::query()->whereNull('user_id')->count(),
        ];
    }
}
