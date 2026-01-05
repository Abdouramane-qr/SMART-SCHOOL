<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClasseResource\Pages;
use App\Models\Classe;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class ClasseResource extends Resource
{
    protected static ?string $model = Classe::class;

    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';
    protected static ?string $navigationGroup = 'Gestion Scolaire';
    protected static ?string $navigationLabel = 'Classes';

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
                Select::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(100),
                TextInput::make('level')
                    ->label('Niveau')
                    ->required()
                    ->maxLength(100),
                Select::make('enseignants')
                    ->label('Enseignants')
                    ->relationship('enseignants', 'last_name')
                    ->searchable()
                    ->preload()
                    ->multiple(),
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
                TextColumn::make('level')
                    ->label('Niveau')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('academicYear.name')
                    ->label('Année')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('school.name')
                    ->label('École')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('enseignants_count')
                    ->counts('enseignants')
                    ->label('Enseignants')
                    ->tooltip('Nombre d’enseignants affectés'),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name'),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la classe')
                    ->url(fn (Classe $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListClasses::route('/'),
            'create' => Pages\CreateClasse::route('/create'),
            'edit' => Pages\EditClasse::route('/{record}/edit'),
        ];
    }
}
