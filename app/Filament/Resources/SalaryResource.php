<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SalaryResource\Pages;
use App\Models\Enseignant;
use App\Models\Salary;
use Filament\Forms\Form;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class SalaryResource extends Resource
{
    protected static ?string $model = Salary::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Salaires';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Select::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name')
                    ->searchable()
                    ->preload()
                    ->default(fn () => auth()->user()?->school_id)
                    ->required(),
                Select::make('teacher_id')
                    ->label('Enseignant')
                    ->relationship('teacher', 'last_name')
                    ->searchable()
                    ->preload()
                    ->getOptionLabelFromRecordUsing(
                        fn (Enseignant $record): string => "{$record->first_name} {$record->last_name}"
                    )
                    ->required(),
                TextInput::make('amount')
                    ->label('Salaire brut')
                    ->numeric()
                    ->required(),
                TextInput::make('bonus')
                    ->label('Bonus')
                    ->numeric()
                    ->default(0),
                TextInput::make('deductions')
                    ->label('Retenues')
                    ->numeric()
                    ->default(0),
                TextInput::make('net_amount')
                    ->label('Salaire net')
                    ->numeric()
                    ->required(),
                DatePicker::make('payment_date')
                    ->label('Date de paiement')
                    ->required(),
                Select::make('month')
                    ->label('Mois')
                    ->options([
                        'janvier' => 'Janvier',
                        'fevrier' => 'Février',
                        'mars' => 'Mars',
                        'avril' => 'Avril',
                        'mai' => 'Mai',
                        'juin' => 'Juin',
                        'juillet' => 'Juillet',
                        'aout' => 'Août',
                        'septembre' => 'Septembre',
                        'octobre' => 'Octobre',
                        'novembre' => 'Novembre',
                        'decembre' => 'Décembre',
                    ])
                    ->required(),
                TextInput::make('year')
                    ->label('Année')
                    ->numeric()
                    ->required(),
                Textarea::make('notes')
                    ->label('Notes')
                    ->rows(3),
                Select::make('status')
                    ->label('Statut')
                    ->options([
                        'draft' => 'Brouillon',
                        'submitted' => 'Soumis',
                        'approved' => 'Validé',
                        'paid' => 'Payé',
                    ])
                    ->required()
                    ->default('submitted'),
                Hidden::make('created_by')
                    ->default(fn () => auth()->id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('teacher.last_name')
                    ->label('Enseignant')
                    ->formatStateUsing(fn (string $state, Salary $record): string => "{$record->teacher?->first_name} {$record->teacher?->last_name}")
                    ->searchable()
                    ->sortable(),
                TextColumn::make('amount')
                    ->label('Brut')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('net_amount')
                    ->label('Net')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('month')
                    ->label('Mois')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'janvier' => 'Janvier',
                        'fevrier' => 'Février',
                        'mars' => 'Mars',
                        'avril' => 'Avril',
                        'mai' => 'Mai',
                        'juin' => 'Juin',
                        'juillet' => 'Juillet',
                        'aout' => 'Août',
                        'septembre' => 'Septembre',
                        'octobre' => 'Octobre',
                        'novembre' => 'Novembre',
                        'decembre' => 'Décembre',
                        default => $state,
                    }),
                TextColumn::make('year')
                    ->label('Année')
                    ->sortable(),
                TextColumn::make('payment_date')
                    ->label('Payé le')
                    ->date()
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved', 'paid' => 'success',
                        'submitted' => 'warning',
                        'draft' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'draft' => 'Brouillon',
                        'submitted' => 'Soumis',
                        'approved' => 'Validé',
                        'paid' => 'Payé',
                        default => $state,
                    }),
                TextColumn::make('school.name')
                    ->label('École')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('teacher_id')
                    ->label('Enseignant')
                    ->relationship('teacher', 'last_name'),
                SelectFilter::make('month')
                    ->label('Mois')
                    ->options([
                        'janvier' => 'Janvier',
                        'fevrier' => 'Février',
                        'mars' => 'Mars',
                        'avril' => 'Avril',
                        'mai' => 'Mai',
                        'juin' => 'Juin',
                        'juillet' => 'Juillet',
                        'aout' => 'Août',
                        'septembre' => 'Septembre',
                        'octobre' => 'Octobre',
                        'novembre' => 'Novembre',
                        'decembre' => 'Décembre',
                    ]),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (Salary $record): string => static::getUrl('edit', ['record' => $record])),
                Tables\Actions\EditAction::make()
                    ->tooltip('Modifier'),
                Tables\Actions\DeleteAction::make()
                    ->tooltip('Supprimer'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSalaries::route('/'),
            'create' => Pages\CreateSalary::route('/create'),
            'edit' => Pages\EditSalary::route('/{record}/edit'),
        ];
    }
}
