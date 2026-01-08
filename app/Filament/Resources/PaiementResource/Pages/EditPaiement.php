<?php

namespace App\Filament\Resources\PaiementResource\Pages;

use App\Filament\Resources\PaiementResource;
use App\Services\FinanceService;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

class EditPaiement extends EditRecord
{
    protected static string $resource = PaiementResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        return app(FinanceService::class)->updatePayment($record, $data);
    }

    protected function handleRecordDeletion(Model $record): void
    {
        app(FinanceService::class)->deletePayment($record);
    }
}
