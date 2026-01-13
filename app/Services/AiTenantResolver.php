<?php

namespace App\Services;

use App\Models\Eleve;
use App\Models\ParentModel;
use App\Models\School;
use App\Models\User;

class AiTenantResolver
{
    public function resolveSchoolId(User $user): ?int
    {
        if (isset($user->school_id) && $user->school_id) {
            return (int) $user->school_id;
        }

        $enseignantSchoolId = $user->enseignant?->school_id;
        if ($enseignantSchoolId) {
            return (int) $enseignantSchoolId;
        }

        $eleveSchoolId = Eleve::query()
            ->where('user_id', $user->id)
            ->value('school_id');
        if ($eleveSchoolId) {
            return (int) $eleveSchoolId;
        }

        $parentSchoolId = ParentModel::query()
            ->where('user_id', $user->id)
            ->value('school_id');
        if ($parentSchoolId) {
            return (int) $parentSchoolId;
        }

        return School::query()->value('id');
    }
}
