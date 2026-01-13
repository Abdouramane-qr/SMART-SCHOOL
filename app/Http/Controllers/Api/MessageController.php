<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Message::class, 'message');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $box = $request->string('box')->lower();

        $query = Message::query()
            ->with(['sender', 'recipient'])
            ->orderByDesc('created_at');

        if ($box === 'sent') {
            $query->where('sender_id', $user->id);
        } else {
            $query->where('recipient_id', $user->id);
        }

        return MessageResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'subject' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'parent_message_id' => ['nullable', 'integer', 'exists:messages,id'],
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $validated['recipient_id'],
            'subject' => $validated['subject'],
            'content' => $validated['content'],
            'parent_message_id' => $validated['parent_message_id'] ?? null,
        ]);

        return new MessageResource($message->load(['sender', 'recipient']));
    }

    public function update(Request $request, Message $message)
    {
        $validated = $request->validate([
            'is_read' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('is_read', $validated)) {
            $message->is_read = $validated['is_read'];
            $message->read_at = $validated['is_read'] ? now() : null;
            $message->save();
        }

        return new MessageResource($message->load(['sender', 'recipient']));
    }

    public function destroy(Message $message)
    {
        $message->delete();

        return response()->noContent();
    }
}
