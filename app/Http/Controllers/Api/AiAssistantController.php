<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\AiRagSecurityException;
use App\Services\AiRagService;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function respond(Request $request, AiRagService $ragService)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array'],
            'messages.*.role' => ['required', 'string'],
            'messages.*.content' => ['required', 'string'],
            'userRole' => ['nullable', 'string', 'max:50'],
            'explain' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json([
                'data' => [
                    'content' => "Assistant local: utilisateur non authentifie.",
                ],
            ]);
        }

        if (! empty($validated['explain'])) {
            try {
                $ragService->enableExplainMode($user);
            } catch (AiRagSecurityException $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 403);
            }
        }

        $last = collect($validated['messages'])->last();
        $content = trim((string) ($last['content'] ?? ''));

        $reply = $ragService->respond($user, $content, $validated['userRole'] ?? null);

        return response()->json(['data' => ['content' => $reply]]);
    }
}
