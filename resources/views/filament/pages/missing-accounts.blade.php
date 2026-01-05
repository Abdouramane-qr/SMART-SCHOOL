<x-filament::page>
    <div class="space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
            <x-filament::card>
                <div class="text-sm text-gray-500">Élèves sans compte</div>
                <div class="text-3xl font-bold">{{ $elevesMissing }}</div>
                <div class="mt-3">
                    <x-filament::button
                        tag="a"
                        href="{{ route('filament.admin.resources.eleves.index', ['tableFilters' => ['has_user' => ['value' => 'without']]]) }}"
                    >
                        Voir la liste
                    </x-filament::button>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="text-sm text-gray-500">Enseignants sans compte</div>
                <div class="text-3xl font-bold">{{ $teachersMissing }}</div>
                <div class="mt-3">
                    <x-filament::button
                        tag="a"
                        href="{{ route('filament.admin.resources.enseignants.index', ['tableFilters' => ['has_user' => ['value' => 'without']]]) }}"
                    >
                        Voir la liste
                    </x-filament::button>
                </div>
            </x-filament::card>

            <x-filament::card>
                <div class="text-sm text-gray-500">Parents sans compte</div>
                <div class="text-3xl font-bold">{{ $parentsMissing }}</div>
                <div class="mt-3">
                    <x-filament::button
                        tag="a"
                        href="{{ route('filament.admin.resources.parents.index', ['tableFilters' => ['has_user' => ['value' => 'without']]]) }}"
                    >
                        Voir la liste
                    </x-filament::button>
                </div>
            </x-filament::card>
        </div>
    </div>
</x-filament::page>
