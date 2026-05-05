<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('user', [
                'id' => $this->user?->id,
                'username' => $this->user?->username,
                'email' => $this->user?->email,
            ]),
            'action' => $this->action,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
