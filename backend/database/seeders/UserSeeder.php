<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'admin@zipher.local'],
            [
                'username' => 'adminzipher',
                'password' => Hash::make('admin12345'),
                'email_verified_at' => now(),
            ]
        );

        $user->forceFill([
            'role' => 'admin',
            'is_banned' => false,
        ])->save();
    }
}
