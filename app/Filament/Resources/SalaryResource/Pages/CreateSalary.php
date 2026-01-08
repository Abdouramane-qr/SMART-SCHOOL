<?php

namespace App\Filament\Resources\SalaryResource\Pages;

use App\Filament\Resources\SalaryResource;
use App\Services\FinanceService;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;

class CreateSalary extends CreateRecord
{
    protected static string $resource = SalaryResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        return app(FinanceService::class)->createSalary($data);
    }
}
