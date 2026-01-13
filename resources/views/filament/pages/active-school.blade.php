<x-filament::page>
    <x-filament::form wire:submit="save">
        {{ $this->form }}

        <x-filament::button type="submit">
            Mettre a jour
        </x-filament::button>
    </x-filament::form>
</x-filament::page>
