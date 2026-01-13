<x-filament::page>
    <div class="space-y-12">
        <section
            class="relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-sm"
        >
            <div class="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-primary"></div>
            <div class="relative flex flex-col gap-6 pl-2 lg:flex-row lg:items-end lg:justify-between">
                <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pilotage
                    </p>
                    <h2 class="text-2xl font-semibold text-foreground">
                        Tableau de bord
                    </h2>
                    <p class="max-w-xl text-sm text-muted-foreground">
                        Suivez les indicateurs clefs et ajustez rapidement vos filtres.
                    </p>
                </div>

                <form
                    method="GET"
                    class="grid w-full gap-4 sm:grid-cols-2 lg:max-w-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
                >
                    @if($schools->count() > 1)
                        <div class="w-full">
                            <x-filament::input.wrapper>
                                <x-filament::input.select
                                    name="school_id"
                                    wire:model.live="schoolId"
                                >
                                    <option value="">Toutes les écoles</option>
                                    @foreach($schools as $school)
                                        <option value="{{ $school->id }}" @selected($selectedSchoolId == $school->id)>
                                            {{ $school->name }}
                                        </option>
                                    @endforeach
                                </x-filament::input.select>
                            </x-filament::input.wrapper>
                        <p class="mt-1 text-xs text-muted-foreground">École</p>
                    </div>
                @endif

                    <div class="w-full">
                        <x-filament::input.wrapper>
                            <x-filament::input.select
                                name="academic_year_id"
                                wire:model.live="academicYearId"
                            >
                                <option value="">Année active</option>
                                @foreach($years as $year)
                                    <option value="{{ $year->id }}" @selected($selectedAcademicYearId == $year->id)>
                                        {{ $year->name }}
                                    </option>
                                @endforeach
                            </x-filament::input.select>
                        </x-filament::input.wrapper>
                        <p class="mt-1 text-xs text-muted-foreground">Année scolaire</p>
                    </div>

                    <x-filament::button type="submit" size="sm" color="primary">
                        Appliquer
                    </x-filament::button>
                </form>
            </div>
        </section>

        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Apercu financier</h2>
                <span
                    class="rounded-full border border-border bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                >
                    Mensuel
                </span>
            </div>
            <div class="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                <x-filament-widgets::widgets :widgets="$this->getHeaderWidgets()" />
            </div>
        </section>

        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Tendances</h2>
                <span
                    class="rounded-full border border-border bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                >
                    Analyse
                </span>
            </div>
            <div class="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
                <x-filament-widgets::widgets :widgets="$this->getWidgets()" />
            </div>
        </section>
    </div>
</x-filament::page>
