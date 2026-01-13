<?php

namespace Tests\Unit;

use App\Models\School;
use App\Support\SchoolResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_require_active_id_activates_first_school_when_none_active(): void
    {
        $schoolA = School::create(['name' => 'School A', 'code' => 'A', 'is_active' => false]);
        $schoolB = School::create(['name' => 'School B', 'code' => 'B', 'is_active' => false]);

        $activeId = SchoolResolver::requireActiveId();

        $this->assertSame($schoolA->id, $activeId);
        $this->assertTrue(School::query()->whereKey($schoolA->id)->value('is_active'));
        $this->assertFalse(School::query()->whereKey($schoolB->id)->value('is_active'));
    }

    public function test_require_active_id_returns_active_school_after_toggle(): void
    {
        $schoolA = School::create(['name' => 'School A', 'code' => 'A', 'is_active' => true]);
        $schoolB = School::create(['name' => 'School B', 'code' => 'B', 'is_active' => true]);

        $activeId = SchoolResolver::requireActiveId();

        $this->assertSame($schoolB->id, $activeId);
        $this->assertFalse(School::query()->whereKey($schoolA->id)->value('is_active'));
        $this->assertTrue(School::query()->whereKey($schoolB->id)->value('is_active'));
    }
}
