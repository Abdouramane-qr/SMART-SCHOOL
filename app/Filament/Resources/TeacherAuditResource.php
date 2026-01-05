<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TeacherAuditResource\Pages;
use App\Models\Enseignant;
use App\Models\TeacherAudit;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class TeacherAuditResource extends Resource
{
    protected static ?string $model = TeacherAudit::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Audits enseignants';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Select::make('teacher_id')
                    ->label('Enseignant')
                    ->relationship('teacher', 'last_name')
                    ->searchable()
                    ->preload()
                    ->getOptionLabelFromRecordUsing(
                        fn (Enseignant $record): string => "{$record->first_name} {$record->last_name}"
                    )
                    ->disabled(),
                TextInput::make('action')
                    ->label('Action')
                    ->disabled(),
                Textarea::make('old_data')
                    ->label('Données avant')
                    ->formatStateUsing(fn ($state): string => $state ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : '')
                    ->disabled()
                    ->rows(5),
                Textarea::make('new_data')
                    ->label('Données après')
                    ->formatStateUsing(fn ($state): string => $state ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : '')
                    ->disabled()
                    ->rows(5),
                Textarea::make('notes')
                    ->label('Notes')
                    ->disabled()
                    ->rows(3),
                TextInput::make('changed_at')
                    ->label('Modifié le')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('teacher.last_name')
                    ->label('Enseignant')
                    ->formatStateUsing(fn (string $state, TeacherAudit $record): string => "{$record->teacher?->first_name} {$record->teacher?->last_name}")
                    ->sortable()
                    ->searchable(),
                TextColumn::make('action')
                    ->label('Action')
                    ->badge()
                    ->sortable(),
                TextColumn::make('changer.name')
                    ->label('Modifié par')
                    ->toggleable(),
                TextColumn::make('changed_at')
                    ->label('Date')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('notes')
                    ->label('Notes')
                    ->limit(30)
                    ->tooltip(fn (TeacherAudit $record): ?string => $record->notes),
            ])
            ->filters([
                SelectFilter::make('teacher_id')
                    ->label('Enseignant')
                    ->relationship('teacher', 'last_name'),
                SelectFilter::make('action')
                    ->label('Action'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->tooltip('Consulter'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('changed_at', 'desc');
    }

    public static function canCreate(): bool
    {
        return false;
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
            'index' => Pages\ListTeacherAudits::route('/'),
            'view' => Pages\ViewTeacherAudit::route('/{record}'),
        ];
    }
}
