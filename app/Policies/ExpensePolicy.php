<?php

namespace App\Policies;

class ExpensePolicy extends BaseResourcePolicy
{
    protected string $permissionPrefix = 'expense';
}
