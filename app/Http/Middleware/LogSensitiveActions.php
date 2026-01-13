<?php

namespace App\Http\Middleware;

use App\Services\GlobalAuditLogger;
use App\Support\SchoolResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogSensitiveActions
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $method = strtoupper($request->method());
        if (! in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        try {
            $user = Auth::user();
            $role = $user?->getRoleNames()->values()->all() ?? [];

            GlobalAuditLogger::log('request', 'sensitive_action', [
                'school_id' => SchoolResolver::activeId(),
                'user_id' => $user?->id,
                'role' => $role ? implode(',', $role) : null,
                'method' => $method,
                'path' => $request->path(),
                'route' => $request->route()?->getName(),
            ]);
        } catch (\Throwable) {
            // Never block the request on audit logging failures.
        }

        return $response;
    }
}
