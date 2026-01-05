<?php

namespace App\Policies;

class TeacherAuditPolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'teacher_audit';
}
