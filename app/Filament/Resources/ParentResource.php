<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ParentResource\Pages;
use App\Models\Eleve;
use App\Models\ParentModel;
use App\Models\User;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class ParentResource extends Resource
{
    protected static ?string $model = ParentModel::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Parents';
    protected static ?string $slug = 'parents';

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
                TextInput::make('first_name')
                    ->label('Prénom')
                    ->required()
                    ->maxLength(120),
                TextInput::make('last_name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(120),
                TextInput::make('email')
                    ->label('Email')
                    ->email()
                    ->required()
                    ->maxLength(190),
                TextInput::make('phone')
                    ->label('Téléphone')
                    ->required()
                    ->maxLength(50),
                Select::make('user_id')
                    ->label('Compte utilisateur')
                    ->relationship('user', 'email')
                    ->modifyQueryUsing(
                        fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'parent'))
                    )
                    ->getOptionLabelFromRecordUsing(
                        fn (User $record): string => $record->full_name ?? $record->name ?? $record->email
                    )
                    ->searchable()
                    ->preload()
                    ->helperText('Créer d\'abord un utilisateur avec le rôle parent.')
                    ->required(),
                Select::make('eleves')
                    ->label('Enfants')
                    ->relationship('eleves', 'last_name')
                    ->getOptionLabelFromRecordUsing(
                        fn (Eleve $record): string => $record->full_name
                            ?? trim("{$record->first_name} {$record->last_name}")
                    )
                    ->searchable()
                    ->preload()
                    ->multiple(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('last_name')
                    ->label('Parent')
                    ->formatStateUsing(fn (string $state, ParentModel $record): string => "{$record->first_name} {$record->last_name}")
                    ->searchable(['first_name', 'last_name', 'email'])
                    ->sortable(),
                TextColumn::make('email')
                    ->label('Email')
                    ->toggleable(),
                TextColumn::make('phone')
                    ->label('Téléphone')
                    ->toggleable(),
                TextColumn::make('eleves_count')
                    ->label('Enfants')
                    ->counts('eleves')
                    ->badge()
                    ->tooltip('Nombre d\'enfants liés'),
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
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (ParentModel $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListParents::route('/'),
            'create' => Pages\CreateParent::route('/create'),
            'edit' => Pages\EditParent::route('/{record}/edit'),
        ];
    }
}
