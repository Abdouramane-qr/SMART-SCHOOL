<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function respond(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array'],
            'messages.*.role' => ['required', 'string'],
            'messages.*.content' => ['required', 'string'],
            'userRole' => ['nullable', 'string', 'max:50'],
        ]);

        $last = collect($validated['messages'])->last();
        $content = trim((string) ($last['content'] ?? ''));

        $reply = $content === ''
            ? "Assistant local: aucune question recue."
            : "Assistant local: j'ai bien recu votre message: \"{$content}\". L'IA n'est pas encore configuree dans cet environnement.";

        return response()->json(['data' => ['content' => $reply]]);
    }
}
