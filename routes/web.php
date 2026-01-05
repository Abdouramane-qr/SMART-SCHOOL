<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'app');
Route::view('/{any}', 'app')->where('any', '^(?!admin|livewire|storage|api|sanctum).*$');
