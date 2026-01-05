<?php

namespace App\Policies;

use App\Models\Classe;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ClassePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('classe.view_any');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Classe $classe): bool
    {
        return $user->can('classe.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('classe.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Classe $classe): bool
    {
        return $user->can('classe.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Classe $classe): bool
    {
        return $user->can('classe.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Classe $classe): bool
    {
        return $user->can('classe.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Classe $classe): bool
    {
        return $user->can('classe.delete');
    }
}
