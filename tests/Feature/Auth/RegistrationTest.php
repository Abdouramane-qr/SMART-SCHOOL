<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->markTestSkipped('SPA auth: no /register screen (React handles auth).');
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $this->assertAuthenticated();
        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'test@example.com');
    }
}
