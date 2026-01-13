<?php

namespace App\Filament\Pages;

use App\Models\School;
use App\Support\SchoolResolver;
use Filament\Forms\Components\Select;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class ActiveSchool extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-check-badge';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Ecole active';
    protected static ?string $slug = 'ecole-active';

    protected static string $view = 'filament.pages.active-school';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'school_id' => SchoolResolver::requireActiveId(),
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Select::make('school_id')
                    ->label('Ecole active')
                    ->options(School::query()->orderBy('name')->pluck('name', 'id'))
                    ->searchable()
                    ->required(),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        $school = School::query()->findOrFail($data['school_id']);
        $school->update(['is_active' => true]);

        Notification::make()
            ->title('Ecole active mise a jour')
            ->success()
            ->send();
    }
}
