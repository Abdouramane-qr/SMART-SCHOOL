<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_assign_roles(): void
    {
        Permission::findOrCreate('user.update');
        Role::findOrCreate('admin');

        $targetUser = User::factory()->create();
        $actor = User::factory()->create();

        $response = $this->actingAs($actor)->postJson('/api/user-roles', [
            'user_id' => $targetUser->id,
            'role' => 'admin',
        ]);

        $response->assertForbidden();
    }

    public function test_message_update_requires_ownership(): void
    {
        Permission::findOrCreate('message.update');
        $actor = User::factory()->create();
        $actor->givePermissionTo('message.update');

        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $message = Message::create([
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'subject' => 'Test',
            'content' => 'Message',
        ]);

        $response = $this->actingAs($actor)->putJson("/api/messages/{$message->id}", [
            'is_read' => true,
        ]);

        $response->assertForbidden();
    }
}
