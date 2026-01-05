<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AssetResource\Pages;
use App\Models\Asset;
use Filament\Forms;
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

class AssetResource extends Resource
{
    protected static ?string $model = Asset::class;

    protected static ?string $navigationIcon = 'heroicon-o-archive-box';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Inventaire';
    protected static ?string $slug = 'assets';

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
                TextInput::make('name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),
                Textarea::make('description')
                    ->label('Description')
                    ->rows(3),
                Select::make('category')
                    ->label('Catégorie')
                    ->options([
                        'informatique' => 'Informatique',
                        'mobilier' => 'Mobilier',
                        'vehicule' => 'Véhicule',
                        'immobilier' => 'Immobilier',
                        'autre' => 'Autre',
                    ])
                    ->searchable()
                    ->required(),
                Select::make('status')
                    ->label('Statut')
                    ->options([
                        'neuf' => 'Neuf',
                        'bon' => 'Bon état',
                        'usage' => 'Usagé',
                        'maintenance' => 'Maintenance',
                        'hors_service' => 'Hors service',
                    ])
                    ->required(),
                DatePicker::make('acquisition_date')
                    ->label('Date d\'acquisition'),
                TextInput::make('acquisition_value')
                    ->label('Valeur d\'acquisition')
                    ->numeric()
                    ->default(0),
                TextInput::make('current_value')
                    ->label('Valeur actuelle')
                    ->numeric()
                    ->default(0),
                TextInput::make('location')
                    ->label('Localisation')
                    ->maxLength(255),
                TextInput::make('serial_number')
                    ->label('Numéro de série')
                    ->maxLength(255),
                TextInput::make('supplier')
                    ->label('Fournisseur')
                    ->maxLength(255),
                DatePicker::make('warranty_end_date')
                    ->label('Fin de garantie'),
                Textarea::make('notes')
                    ->label('Notes')
                    ->rows(3),
                Hidden::make('created_by')
                    ->default(fn () => auth()->id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('category')
                    ->label('Catégorie')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'informatique' => 'Informatique',
                        'mobilier' => 'Mobilier',
                        'vehicule' => 'Véhicule',
                        'immobilier' => 'Immobilier',
                        default => 'Autre',
                    }),
                TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'neuf' => 'success',
                        'bon' => 'info',
                        'usage' => 'warning',
                        'maintenance' => 'warning',
                        'hors_service' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('current_value')
                    ->label('Valeur')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('location')
                    ->label('Localisation')
                    ->toggleable(),
                TextColumn::make('acquisition_date')
                    ->label('Acquis le')
                    ->date()
                    ->sortable(),
                TextColumn::make('school.name')
                    ->label('École')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('category')
                    ->label('Catégorie')
                    ->options([
                        'informatique' => 'Informatique',
                        'mobilier' => 'Mobilier',
                        'vehicule' => 'Véhicule',
                        'immobilier' => 'Immobilier',
                        'autre' => 'Autre',
                    ]),
                SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'neuf' => 'Neuf',
                        'bon' => 'Bon état',
                        'usage' => 'Usagé',
                        'maintenance' => 'Maintenance',
                        'hors_service' => 'Hors service',
                    ]),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (Asset $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListAssets::route('/'),
            'create' => Pages\CreateAsset::route('/create'),
            'edit' => Pages\EditAsset::route('/{record}/edit'),
        ];
    }
}
