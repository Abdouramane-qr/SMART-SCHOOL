<?php

namespace App\Policies;

use App\Models\User;
use App\Support\SchoolResolver;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Model;

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

    public function view(User $user, ?Model $model = null): bool
    {
        $schoolAccess = $this->canAccessSchool($user, $model);
        if ($schoolAccess !== true) {
            return $schoolAccess;
        }
        return $user->can($this->permission('view'));
    }

    public function create(User $user): bool
    {
        return $user->can($this->permission('create'));
    }

    public function update(User $user, ?Model $model = null): bool
    {
        $schoolAccess = $this->canAccessSchool($user, $model);
        if ($schoolAccess !== true) {
            return $schoolAccess;
        }
        return $user->can($this->permission('update'));
    }

    public function delete(User $user, ?Model $model = null): bool
    {
        $schoolAccess = $this->canAccessSchool($user, $model);
        if ($schoolAccess !== true) {
            return $schoolAccess;
        }
        return $user->can($this->permission('delete'));
    }

    public function restore(User $user, ?Model $model = null): bool
    {
        $schoolAccess = $this->canAccessSchool($user, $model);
        if ($schoolAccess !== true) {
            return $schoolAccess;
        }
        return $user->can($this->permission('delete'));
    }

    public function forceDelete(User $user, ?Model $model = null): bool
    {
        $schoolAccess = $this->canAccessSchool($user, $model);
        if ($schoolAccess !== true) {
            return $schoolAccess;
        }
        return $user->can($this->permission('delete'));
    }

    protected function canAccessSchool(User $user, ?Model $model): bool|Response
    {
        if (! $model) {
            return true;
        }

        $activeSchoolId = SchoolResolver::activeId();
        if (! $activeSchoolId) {
            \Illuminate\Support\Facades\Log::warning('BaseResourcePolicy denied access: no active school', [
                'user_id' => $user->id,
                'model' => get_class($model),
            ]);
            return Response::deny("Aucune ecole active n'est definie.", 'active_school_missing');
        }

        $resourceSchoolId = $this->resolveResourceSchoolId($model);
        if (! $resourceSchoolId) {
            return true;
        }

        if ((int) $resourceSchoolId !== (int) $activeSchoolId) {
            \Illuminate\Support\Facades\Log::warning('BaseResourcePolicy denied access: school mismatch', [
                'user_id' => $user->id,
                'model' => get_class($model),
                'resource_school_id' => $resourceSchoolId,
                'active_school_id' => $activeSchoolId,
            ]);
            return Response::deny("Cette ressource n'appartient pas a l'ecole active.", 'school_mismatch');
        }

        return true;
    }

    protected function resolveResourceSchoolId(Model $model): ?int
    {
        $schoolId = $model->getAttribute('school_id');
        if ($schoolId) {
            return (int) $schoolId;
        }

        if (method_exists($model, 'classe') && $model->classe) {
            return $model->classe->school_id ? (int) $model->classe->school_id : null;
        }

        if (method_exists($model, 'eleve') && $model->eleve) {
            return $model->eleve->school_id ? (int) $model->eleve->school_id : null;
        }

        if (method_exists($model, 'teacher') && $model->teacher) {
            return $model->teacher->school_id ? (int) $model->teacher->school_id : null;
        }

        if (method_exists($model, 'school') && $model->school) {
            return $model->school->id ? (int) $model->school->id : null;
        }

        $classeId = $model->getAttribute('classe_id');
        if ($classeId) {
            return \App\Models\Classe::query()->whereKey($classeId)->value('school_id');
        }

        $eleveId = $model->getAttribute('eleve_id');
        if ($eleveId) {
            return \App\Models\Eleve::query()->whereKey($eleveId)->value('school_id');
        }

        $teacherId = $model->getAttribute('teacher_id');
        if ($teacherId) {
            return \App\Models\Enseignant::query()->whereKey($teacherId)->value('school_id');
        }

        return null;
    }
}
