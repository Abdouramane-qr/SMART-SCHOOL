<?php

namespace App\Policies;

class RolePolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'role';
}
