<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FinanceSettingResource\Pages;
use App\Models\FinanceSetting;
use Filament\Forms\Form;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;

class FinanceSettingResource extends Resource
{
    protected static ?string $model = FinanceSetting::class;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Paramètres finance';
    protected static ?string $slug = 'parametres-finance';

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
                Select::make('setting_key')
                    ->label('Clé')
                    ->options([
                        'default_currency' => 'Devise par défaut',
                        'default_tax_rate' => 'TVA par défaut (%)',
                        'usd_to_xof_rate' => 'Taux USD → XOF',
                        'eur_to_xof_rate' => 'Taux EUR → XOF',
                    ])
                    ->searchable()
                    ->required(),
                TextInput::make('setting_value')
                    ->label('Valeur')
                    ->required()
                    ->maxLength(255),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('setting_key')
                    ->label('Clé')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'default_currency' => 'Devise par défaut',
                        'default_tax_rate' => 'TVA par défaut (%)',
                        'usd_to_xof_rate' => 'Taux USD → XOF',
                        'eur_to_xof_rate' => 'Taux EUR → XOF',
                        default => $state,
                    }),
                TextColumn::make('setting_value')
                    ->label('Valeur')
                    ->searchable(),
                TextColumn::make('school.name')
                    ->label('École')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('school_id')
                    ->label('École')
                    ->relationship('school', 'name'),
                SelectFilter::make('setting_key')
                    ->label('Clé')
                    ->options([
                        'default_currency' => 'Devise par défaut',
                        'default_tax_rate' => 'TVA par défaut (%)',
                        'usd_to_xof_rate' => 'Taux USD → XOF',
                        'eur_to_xof_rate' => 'Taux EUR → XOF',
                    ]),
            ])
            ->actions([
                Action::make('open')
                    ->label('Ouvrir')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->tooltip('Ouvrir le paramètre')
                    ->url(fn (FinanceSetting $record): string => static::getUrl('edit', ['record' => $record])),
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
            'index' => Pages\ListFinanceSettings::route('/'),
            'create' => Pages\CreateFinanceSetting::route('/create'),
            'edit' => Pages\EditFinanceSetting::route('/{record}/edit'),
        ];
    }
}
