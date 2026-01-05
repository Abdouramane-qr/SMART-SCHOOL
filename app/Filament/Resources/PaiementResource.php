<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaiementResource\Pages;
use App\Models\Paiement;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class PaiementResource extends Resource
{
    protected static ?string $model = Paiement::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $navigationGroup = 'Gestion Scolaire';
    protected static ?string $navigationLabel = 'Paiements';

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
                Select::make('eleve_id')
                    ->label('Élève')
                    ->relationship('eleve', 'last_name')
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('amount')
                    ->label('Montant')
                    ->numeric()
                    ->required(),
                DatePicker::make('payment_date')
                    ->label('Date de paiement')
                    ->required(),
                TextInput::make('method')
                    ->label('Méthode')
                    ->required()
                    ->maxLength(50),
                Select::make('status')
                    ->options([
                        'paye' => 'Payé',
                        'partiel' => 'Partiel',
                        'en_retard' => 'En retard',
                    ])
                    ->label('Statut')
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('eleve.last_name')
                    ->label('Élève')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('amount')
                    ->label('Montant')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('payment_date')
                    ->label('Date de paiement')
                    ->date()
                    ->sortable(),
                TextColumn::make('method')
                    ->label('Méthode')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paye' => 'success',
                        'partiel' => 'warning',
                        'en_retard' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'paye' => 'Payé',
                        'partiel' => 'Partiel',
                        'en_retard' => 'En retard',
                        default => $state,
                    })
                    ->tooltip(fn (string $state): string => match ($state) {
                        'paye' => 'Paiement reçu',
                        'partiel' => 'Paiement partiel',
                        'en_retard' => 'Paiement en retard',
                        default => 'Statut inconnu',
                    }),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('status')
                    ->options([
                        'paye' => 'Payé',
                        'partiel' => 'Partiel',
                        'en_retard' => 'En retard',
                    ]),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir le paiement')
                    ->url(fn (Paiement $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListPaiements::route('/'),
            'create' => Pages\CreatePaiement::route('/create'),
            'edit' => Pages\EditPaiement::route('/{record}/edit'),
        ];
    }
}
