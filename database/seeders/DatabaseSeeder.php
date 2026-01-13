<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! School::query()->exists()) {
            School::create([
                'name' => 'Smart School',
                'code' => 'SS',
                'is_active' => true,
            ]);
        }

        $this->call(RolesAndPermissionsSeeder::class);
    }
}
