<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BaseResourcePolicy
{
    use HandlesAuthorization;

    protected string $permissionPrefix;

    protected function permission(string $action): string
    {
        return "{$this->permissionPrefix}.{$action}";
    }

    public function viewAny(User $user): bool
    {
        return $user->can($this->permission('view_any'));
    }

    public function view(User $user): bool
    {
        return $user->can($this->permission('view'));
    }

    public function create(User $user): bool
    {
        return $user->can($this->permission('create'));
    }

    public function update(User $user): bool
    {
        return $user->can($this->permission('update'));
    }

    public function delete(User $user): bool
    {
        return $user->can($this->permission('delete'));
    }

    public function restore(User $user): bool
    {
        return $user->can($this->permission('delete'));
    }

    public function forceDelete(User $user): bool
    {
        return $user->can($this->permission('delete'));
    }
}
