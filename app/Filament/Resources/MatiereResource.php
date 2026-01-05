<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MatiereResource\Pages;
use App\Models\Matiere;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class MatiereResource extends Resource
{
    protected static ?string $model = Matiere::class;

    protected static ?string $navigationIcon = 'heroicon-o-book-open';
    protected static ?string $navigationGroup = 'Referentiels';
    protected static ?string $navigationLabel = 'Matieres';

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
                TextInput::make('code')
                    ->label('Code')
                    ->required()
                    ->maxLength(50),
                TextInput::make('coefficient')
                    ->label('Coefficient')
                    ->numeric()
                    ->minValue(0)
                    ->default(1),
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
                TextColumn::make('code')
                    ->label('Code')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('coefficient')
                    ->label('Coefficient')
                    ->sortable()
                    ->tooltip('Coefficient utilisé pour le calcul des moyennes'),
                TextColumn::make('school.name')
                    ->label('École')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->tooltip('Modifier'),
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
            'index' => Pages\ListMatieres::route('/'),
            'create' => Pages\CreateMatiere::route('/create'),
            'edit' => Pages\EditMatiere::route('/{record}/edit'),
        ];
    }
}
