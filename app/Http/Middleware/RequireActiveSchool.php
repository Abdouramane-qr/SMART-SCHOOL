<?php

namespace App\Http\Middleware;

use App\Support\SchoolResolver;
use Closure;
use Illuminate\Http\Request;

class RequireActiveSchool
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        SchoolResolver::requireActiveId();

        return $next($request);
    }
}
