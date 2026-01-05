<?php

namespace App\Filament\Resources\FinanceSettingResource\Pages;

use App\Filament\Resources\FinanceSettingResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditFinanceSetting extends EditRecord
{
    protected static string $resource = FinanceSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
