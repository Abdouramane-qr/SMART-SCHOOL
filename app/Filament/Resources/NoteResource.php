<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NoteResource\Pages;
use App\Models\Note;
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

class NoteResource extends Resource
{
    protected static ?string $model = Note::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Gestion Scolaire';
    protected static ?string $navigationLabel = 'Notes';

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
                Select::make('matiere_id')
                    ->label('Matière')
                    ->relationship('matiere', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                Select::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('value')
                    ->label('Note')
                    ->numeric()
                    ->required(),
                TextInput::make('term')
                    ->label('Période')
                    ->required()
                    ->maxLength(50),
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
                TextColumn::make('matiere.name')
                    ->label('Matière')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('academicYear.name')
                    ->label('Année')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('value')
                    ->label('Note')
                    ->numeric()
                    ->sortable()
                    ->tooltip(fn (Note $record): string => "Note: {$record->value}"),
                TextColumn::make('term')
                    ->label('Période')
                    ->searchable()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name'),
                SelectFilter::make('matiere_id')
                    ->label('Matière')
                    ->relationship('matiere', 'name'),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (Note $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListNotes::route('/'),
            'create' => Pages\CreateNote::route('/create'),
            'edit' => Pages\EditNote::route('/{record}/edit'),
        ];
    }
}
