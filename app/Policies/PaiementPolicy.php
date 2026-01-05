<?php

namespace App\Policies;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PaiementPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('paiement.view_any');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Paiement $paiement): bool
    {
        return $user->can('paiement.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('paiement.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Paiement $paiement): bool
    {
        return $user->can('paiement.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Paiement $paiement): bool
    {
        return $user->can('paiement.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Paiement $paiement): bool
    {
        return $user->can('paiement.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Paiement $paiement): bool
    {
        return $user->can('paiement.delete');
    }
}
