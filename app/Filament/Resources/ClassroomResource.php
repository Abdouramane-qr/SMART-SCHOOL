<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClassroomResource\Pages;
use App\Models\Classroom;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class ClassroomResource extends Resource
{
    protected static ?string $model = Classroom::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationGroup = 'Referentiels';
    protected static ?string $navigationLabel = 'Salles';

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
                TextInput::make('capacity')
                    ->label('Capacité')
                    ->numeric()
                    ->minValue(0),
                TextInput::make('building')
                    ->label('Bâtiment')
                    ->maxLength(255),
                TextInput::make('floor')
                    ->label('Étage')
                    ->numeric(),
                TagsInput::make('equipment')
                    ->label('Équipements'),
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
                TextColumn::make('capacity')
                    ->label('Capacité')
                    ->sortable()
                    ->tooltip('Nombre de places disponibles'),
                TextColumn::make('building')
                    ->label('Bâtiment')
                    ->searchable(),
                TextColumn::make('floor')
                    ->label('Étage')
                    ->sortable(),
                TextColumn::make('equipment')
                    ->label('Équipements')
                    ->formatStateUsing(fn ($state) => is_array($state) ? implode(', ', $state) : (string) $state)
                    ->toggleable(),
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
            'index' => Pages\ListClassrooms::route('/'),
            'create' => Pages\CreateClassroom::route('/create'),
            'edit' => Pages\EditClassroom::route('/{record}/edit'),
        ];
    }
}
