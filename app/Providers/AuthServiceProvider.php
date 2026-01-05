<?php

namespace App\Providers;

use App\Models\Absence;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Note;
use App\Models\Paiement;
use App\Policies\AbsencePolicy;
use App\Policies\ClassePolicy;
use App\Policies\ElevePolicy;
use App\Policies\NotePolicy;
use App\Policies\PaiementPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Eleve::class => ElevePolicy::class,
        Classe::class => ClassePolicy::class,
        Paiement::class => PaiementPolicy::class,
        Note::class => NotePolicy::class,
        Absence::class => AbsencePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function ($user) {
            return method_exists($user, 'hasRole') && $user->hasRole('super_admin') ? true : null;
        });
    }
}
