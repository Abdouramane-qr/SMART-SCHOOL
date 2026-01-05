<?php

namespace App\Filament\Resources\EleveResource\Pages;

use App\Filament\Resources\EleveResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListEleves extends ListRecords
{
    protected static string $resource = EleveResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
