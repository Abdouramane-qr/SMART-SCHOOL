<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('users:normalize-permissions {--dry-run}', function () {
    $dryRun = (bool) $this->option('dry-run');
    $users = User::query()->with('permissions', 'roles')->get();
    $totalDirectPermissions = 0;
    $affectedUsers = 0;

    foreach ($users as $user) {
        $directCount = $user->permissions->count();
        if ($directCount > 0) {
            $affectedUsers += 1;
            $totalDirectPermissions += $directCount;
            if (! $dryRun) {
                $user->syncPermissions([]);
            }
        }
    }

    $this->info(sprintf(
        'Checked %d users. Direct permissions found: %d (users: %d).%s',
        $users->count(),
        $totalDirectPermissions,
        $affectedUsers,
        $dryRun ? ' Dry-run only; no changes applied.' : ''
    ));
})->purpose('Clear direct user permissions to enforce role-scoped access');
