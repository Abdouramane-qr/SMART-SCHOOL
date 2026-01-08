<?php

namespace App\Filament\Resources\PaiementResource\Pages;

use App\Filament\Resources\PaiementResource;
use App\Services\FinanceService;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;

class CreatePaiement extends CreateRecord
{
    protected static string $resource = PaiementResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        return app(FinanceService::class)->createPayment($data);
    }
}
