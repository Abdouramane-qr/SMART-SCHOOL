<?php

namespace App\Http\Controllers;

use App\Support\SchoolResolver;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests;
    protected function resolveSchoolId(Request $request): ?int
    {
        return SchoolResolver::requireActiveId();
    }
}
