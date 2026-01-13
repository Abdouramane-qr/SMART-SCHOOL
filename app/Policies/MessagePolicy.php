<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class MessagePolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'message';

    public function view(User $user, ?Model $model = null): bool
    {
        if ($model instanceof Message && ! $this->isParticipant($user, $model)) {
            return false;
        }

        return parent::view($user, $model);
    }

    public function update(User $user, ?Model $model = null): bool
    {
        if ($model instanceof Message && ! $this->isParticipant($user, $model)) {
            return false;
        }

        return parent::update($user, $model);
    }

    public function delete(User $user, ?Model $model = null): bool
    {
        if ($model instanceof Message && ! $this->isParticipant($user, $model)) {
            return false;
        }

        return parent::delete($user, $model);
    }

    private function isParticipant(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id || $message->recipient_id === $user->id;
    }
}
