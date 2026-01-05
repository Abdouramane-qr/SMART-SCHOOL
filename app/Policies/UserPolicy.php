<?php

namespace App\Policies;

class UserPolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'user';
}
