<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Services\GlobalAuditLogger;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->web(append: [
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'require-active-school' => \App\Http\Middleware\RequireActiveSchool::class,
            'log-sensitive-actions' => \App\Http\Middleware\LogSensitiveActions::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (AuthorizationException $exception, Request $request) {
            GlobalAuditLogger::log('access_denied', 'policy', [
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
                'method' => $request->method(),
                'code' => $exception->response?->code() ?? 'forbidden',
                'message' => $exception->response?->message() ?? $exception->getMessage(),
            ]);

            if (! $request->expectsJson()) {
                return null;
            }

            $response = $exception->response;
            $code = $response?->code() ?? 'forbidden';
            $message = $response?->message() ?? "Acces interdit.";

            return response()->json([
                'error' => [
                    'code' => $code,
                    'message' => $message,
                ],
            ], 403);
        });

        $exceptions->renderable(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->expectsJson() || $exception->getStatusCode() !== 409) {
                return null;
            }

            return response()->json([
                'error' => [
                    'code' => 'active_school_missing',
                    'message' => $exception->getMessage()
                        ?: "Aucune ecole active n'est definie. Activez une ecole pour continuer.",
                ],
            ], 409);
        });
    })->create();
