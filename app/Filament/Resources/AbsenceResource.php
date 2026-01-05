<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AbsenceResource\Pages;
use App\Models\Absence;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class AbsenceResource extends Resource
{
    protected static ?string $model = Absence::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';
    protected static ?string $navigationGroup = 'Gestion Scolaire';
    protected static ?string $navigationLabel = 'Absences';

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
                Select::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name')
                    ->searchable()
                    ->preload(),
                DatePicker::make('date')
                    ->label('Date')
                    ->required(),
                Textarea::make('reason')
                    ->label('Motif')
                    ->rows(3)
                    ->maxLength(255),
                Toggle::make('is_justified')
                    ->label('Justifiée'),
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
                TextColumn::make('date')
                    ->label('Date')
                    ->date()
                    ->sortable(),
                TextColumn::make('reason')
                    ->label('Motif')
                    ->limit(30)
                    ->tooltip(fn (Absence $record): ?string => $record->reason),
                TextColumn::make('is_justified')
                    ->label('Statut')
                    ->badge()
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Justifiée' : 'Non justifiée')
                    ->color(fn (bool $state): string => $state ? 'success' : 'danger')
                    ->tooltip(fn (bool $state): string => $state ? 'Absence justifiée' : 'Absence non justifiée'),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('academic_year_id')
                    ->label('Année scolaire')
                    ->relationship('academicYear', 'name'),
                SelectFilter::make('is_justified')
                    ->label('Statut')
                    ->options([
                        1 => 'Justifiée',
                        0 => 'Non justifiée',
                    ]),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (Absence $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListAbsences::route('/'),
            'create' => Pages\CreateAbsence::route('/create'),
            'edit' => Pages\EditAbsence::route('/{record}/edit'),
        ];
    }
}
