<?php

namespace App\Policies;

class ParentModelPolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'parent';
}
