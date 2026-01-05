<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $sender = $this->whenLoaded('sender');
        $recipient = $this->whenLoaded('recipient');

        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'recipient_id' => $this->recipient_id,
            'subject' => $this->subject,
            'content' => $this->content,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at,
            'parent_message_id' => $this->parent_message_id,
            'sender' => $sender ? [
                'id' => $sender->id,
                'full_name' => $sender->full_name ?? $sender->name,
                'email' => $sender->email,
            ] : null,
            'recipient' => $recipient ? [
                'id' => $recipient->id,
                'full_name' => $recipient->full_name ?? $recipient->name,
                'email' => $recipient->email,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
