<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TeacherResource\Pages;
use App\Models\Classe;
use App\Models\Enseignant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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

class TeacherResource extends Resource
{
    protected static ?string $model = Enseignant::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Enseignants';
    protected static ?string $slug = 'enseignants';

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
                    ->maxLength(190),
                TextInput::make('phone')
                    ->label('Téléphone')
                    ->maxLength(50),
                Select::make('user_id')
                    ->label('Compte utilisateur')
                    ->relationship(
                        'user',
                        'email',
                        modifyQueryUsing: fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'enseignant'))
                    )
                    ->getOptionLabelFromRecordUsing(
                        fn (User $record): string => $record->full_name ?? $record->name ?? $record->email
                    )
                    ->required(fn (Get $get) => empty($get('account_password')))
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
                            ->maxLength(190)
                            ->default(fn (Get $get) => $get('../../email')),
                        TextInput::make('phone')
                            ->label('Téléphone')
                            ->maxLength(50)
                            ->default(fn (Get $get) => $get('../../phone')),
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
                            'phone' => $data['phone'] ?? null,
                            'password' => Hash::make($data['password']),
                        ]);

                        $user->assignRole('enseignant');

                        return $user->id;
                    })
                    ->searchable()
                    ->preload()
                    ->helperText('Sélectionnez un compte existant ou laissez vide pour créer automatiquement.')
                    ->dehydrated(true),
                TextInput::make('account_password')
                    ->label('Mot de passe du compte')
                    ->password()
                    ->minLength(8)
                    ->required(fn (Get $get) => empty($get('user_id')))
                    ->visible(fn (Get $get) => empty($get('user_id')))
                    ->dehydrated(true),
                TextInput::make('specialization')
                    ->label('Spécialité')
                    ->maxLength(150),
                DatePicker::make('hire_date')
                    ->label('Date d\'embauche'),
                TextInput::make('monthly_salary')
                    ->label('Salaire mensuel')
                    ->numeric()
                    ->default(0),
                Select::make('classes')
                    ->label('Classes')
                    ->relationship('classes', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable()
                    ->getOptionLabelFromRecordUsing(
                        fn (Classe $record): string => "{$record->level} {$record->name}"
                    ),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('last_name')
                    ->label('Enseignant')
                    ->formatStateUsing(fn (string $state, Enseignant $record): string => "{$record->first_name} {$record->last_name}")
                    ->searchable(['first_name', 'last_name', 'email'])
                    ->sortable(),
                TextColumn::make('email')
                    ->label('Email')
                    ->toggleable(),
                TextColumn::make('phone')
                    ->label('Téléphone')
                    ->toggleable(),
                TextColumn::make('specialization')
                    ->label('Spécialité')
                    ->toggleable(),
                TextColumn::make('classes_count')
                    ->label('Classes')
                    ->counts('classes')
                    ->badge()
                    ->tooltip('Nombre de classes affectées'),
                TextColumn::make('monthly_salary')
                    ->label('Salaire')
                    ->numeric()
                    ->toggleable(),
                TextColumn::make('hire_date')
                    ->label('Embauché le')
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
                    ->url(fn (Enseignant $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListTeachers::route('/'),
            'create' => Pages\CreateTeacher::route('/create'),
            'edit' => Pages\EditTeacher::route('/{record}/edit'),
        ];
    }
}
