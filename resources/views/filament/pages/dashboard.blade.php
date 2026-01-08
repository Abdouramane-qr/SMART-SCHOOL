<x-filament::page>
    <div class="space-y-8">
        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Filtres</h2>
            <form method="GET" class="flex flex-wrap items-end gap-4">
                @if($schools->count() > 1)
                    <div class="w-full max-w-xs">
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
                        <p class="text-xs text-muted-foreground mt-1">École</p>
                    </div>
                @endif

                <div class="w-full max-w-xs">
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
                    <p class="text-xs text-muted-foreground mt-1">Année scolaire</p>
                </div>

                <x-filament::button type="submit" size="sm" color="gray">
                    Appliquer
                </x-filament::button>
            </form>
        </section>

        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Apercu financier</h2>
            <x-filament-widgets::widgets :widgets="$this->getHeaderWidgets()" />
        </section>

        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Tendances</h2>
            <x-filament-widgets::widgets :widgets="$this->getWidgets()" />
        </section>

        <section class="space-y-3">
            <h2 class="text-lg font-semibold">Compte</h2>
            <x-filament-widgets::widgets :widgets="$this->getFooterWidgets()" />
        </section>
    </div>
</x-filament::page>
