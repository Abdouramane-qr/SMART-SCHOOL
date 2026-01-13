<?php

namespace App\Filament\Pages;

use App\Models\AuditLog;
use App\Filament\Concerns\HasSystemAlerts;
use Filament\Pages\Page;
use Filament\Tables\Table;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Forms\Components\DatePicker;
use Illuminate\Database\Eloquent\Builder;

class AuditSecurity extends Page implements HasTable
{
    use InteractsWithTable;
    use HasSystemAlerts;

    protected static ?string $navigationIcon = 'heroicon-o-shield-check';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Audit & Security';
    protected static ?string $title = 'Audit & Security';
    protected static string $view = 'filament.pages.audit-security';

    public function mount(): void
    {
        $this->notifySystemAlerts();
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();
        if (! $user) {
            return false;
        }

        return in_array('super_admin', $user->getRoleNames()->values()->all(), true);
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(AuditLog::query()->orderByDesc('created_at'))
            ->columns([
                TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('user_id')
                    ->label('Utilisateur')
                    ->sortable(),
                TextColumn::make('role')
                    ->label('Role')
                    ->badge()
                    ->sortable(),
                TextColumn::make('action')
                    ->label('Action')
                    ->badge()
                    ->sortable(),
                TextColumn::make('entity')
                    ->label('Entite')
                    ->badge()
                    ->sortable(),
                TextColumn::make('severity')
                    ->label('Severite')
                    ->badge()
                    ->getStateUsing(fn (AuditLog $record): string => $this->severityFor($record))
                    ->color(fn (string $state): string => match ($state) {
                        'critical' => 'danger',
                        'warning' => 'warning',
                        default => 'info',
                    }),
                TextColumn::make('ip')
                    ->label('IP')
                    ->toggleable(),
                TextColumn::make('metadata')
                    ->label('Details')
                    ->limit(40)
                    ->tooltip(fn (AuditLog $record): ?string => $this->formatMetadata($record)),
            ])
            ->filters([
                SelectFilter::make('role')
                    ->label('Role')
                    ->options(fn () => AuditLog::query()
                        ->whereNotNull('role')
                        ->distinct()
                        ->orderBy('role')
                        ->pluck('role', 'role')
                        ->all())
                    ->query(fn (Builder $query, array $data): Builder => $query
                        ->when($data['value'] ?? null, fn (Builder $query, string $value) => $query->where('role', $value))),
                SelectFilter::make('action')
                    ->label('Action')
                    ->options(fn () => AuditLog::query()
                        ->whereNotNull('action')
                        ->distinct()
                        ->orderBy('action')
                        ->pluck('action', 'action')
                        ->all()),
                Filter::make('created_at')
                    ->label('Periode')
                    ->form([
                        DatePicker::make('from')->label('Du'),
                        DatePicker::make('until')->label('Au'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when($data['from'] ?? null, fn (Builder $query, $date) => $query->whereDate('created_at', '>=', $date))
                            ->when($data['until'] ?? null, fn (Builder $query, $date) => $query->whereDate('created_at', '<=', $date));
                    }),
            ])
            ->actions([])
            ->bulkActions([])
            ->recordUrl(null)
            ->defaultPaginationPageOption(25);
    }

    private function severityFor(AuditLog $record): string
    {
        $meta = $this->decodeMetadata($record->metadata);
        $status = $meta['status'] ?? null;

        if ($record->action === 'access_denied') {
            return 'critical';
        }

        if ($record->action === 'ai_rag_call') {
            return match ($status) {
                'unexpected_document' => 'critical',
                'no_access', 'rate_limited', 'no_data' => 'warning',
                default => 'info',
            };
        }

        if ($record->action === 'import' && ($meta['errors_count'] ?? 0) > 0) {
            return 'warning';
        }

        return 'info';
    }

    private function decodeMetadata($metadata): array
    {
        if (is_array($metadata)) {
            return $metadata;
        }

        if (! is_string($metadata) || $metadata === '') {
            return [];
        }

        $decoded = json_decode($metadata, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function formatMetadata(AuditLog $record): ?string
    {
        $meta = $this->decodeMetadata($record->metadata);
        if (! $meta) {
            return null;
        }

        return json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}
