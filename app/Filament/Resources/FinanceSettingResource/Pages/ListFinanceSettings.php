<?php

namespace App\Filament\Resources\FinanceSettingResource\Pages;

use App\Filament\Resources\FinanceSettingResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListFinanceSettings extends ListRecords
{
    protected static string $resource = FinanceSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
