<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EleveResource\Pages;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class EleveResource extends Resource
{
    protected static ?string $model = Eleve::class;

    protected static ?string $navigationIcon = 'heroicon-o-user';
    protected static ?string $navigationGroup = 'Gestion Scolaire';
    protected static ?string $navigationLabel = 'Eleves';

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
                Select::make('classe_id')
                    ->label('Classe')
                    ->relationship('classe', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('first_name')
                    ->label('Prénom')
                    ->required()
                    ->maxLength(100),
                TextInput::make('last_name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(100),
                Select::make('gender')
                    ->label('Sexe')
                    ->options([
                        'M' => 'M',
                        'F' => 'F',
                    ])
                    ->required(),
                DatePicker::make('birth_date')
                    ->label('Date de naissance')
                    ->required(),
                Select::make('user_id')
                    ->label('Compte utilisateur')
                    ->relationship(
                        'user',
                        'email',
                        modifyQueryUsing: fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'eleve'))
                    )
                    ->getOptionLabelFromRecordUsing(
                        fn (User $record): string => $record->full_name ?? $record->name ?? $record->email
                    )
                    ->required(fn (Get $get) => empty($get('account_email')))
                    ->createOptionForm([
                        TextInput::make('full_name')
                            ->label('Nom complet')
                            ->required()
                            ->maxLength(150)
                            ->default(fn (Get $get) => trim(
                                ($get('../../first_name') ?? '').' '.($get('../../last_name') ?? '')
                            )),
                        TextInput::make('email')
                            ->label('Email')
                            ->email()
                            ->required()
                            ->maxLength(190),
                        TextInput::make('password')
                            ->label('Mot de passe')
                            ->password()
                            ->required()
                            ->minLength(8),
                    ])
                    ->createOptionUsing(function (array $data): int {
                        $fullName = trim($data['full_name'] ?? '');
                        if ($fullName === '') {
                            $fullName = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
                        }

                        $user = User::create([
                            'name' => $fullName,
                            'full_name' => $fullName,
                            'email' => $data['email'],
                            'password' => Hash::make($data['password']),
                        ]);

                        $user->assignRole('eleve');

                        return $user->id;
                    })
                    ->searchable()
                    ->preload()
                    ->helperText('Sélectionnez un compte existant ou laissez vide pour créer automatiquement.')
                    ->dehydrated(true),
                TextInput::make('account_email')
                    ->label('Email du compte')
                    ->email()
                    ->maxLength(190)
                    ->required(fn (Get $get) => empty($get('user_id')))
                    ->visible(fn (Get $get) => empty($get('user_id')))
                    ->dehydrated(true),
                TextInput::make('account_password')
                    ->label('Mot de passe du compte')
                    ->password()
                    ->minLength(8)
                    ->required(fn (Get $get) => empty($get('user_id')))
                    ->visible(fn (Get $get) => empty($get('user_id')))
                    ->dehydrated(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('first_name')
                    ->label('Prénom')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('last_name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('classe.name')
                    ->label('Classe')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('school.name')
                    ->label('École')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('gender')
                    ->label('Sexe')
                    ->sortable(),
                TextColumn::make('birth_date')
                    ->label('Date de naissance')
                    ->date()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('classe_id')
                    ->label('Classe')
                    ->relationship('classe', 'name'),
                SelectFilter::make('has_user')
                    ->label('Compte')
                    ->options([
                        'with' => 'Avec compte',
                        'without' => 'Sans compte',
                    ])
                    ->query(function ($query, array $data) {
                        if (($data['value'] ?? null) === 'with') {
                            return $query->whereNotNull('user_id');
                        }
                        if (($data['value'] ?? null) === 'without') {
                            return $query->whereNull('user_id');
                        }
                        return $query;
                    }),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir la fiche')
                    ->url(fn (Eleve $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListEleves::route('/'),
            'create' => Pages\CreateEleve::route('/create'),
            'edit' => Pages\EditEleve::route('/{record}/edit'),
        ];
    }
}
