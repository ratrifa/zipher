<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's users.
     */
    public function run(): void
    {
        $seedUsers = [
            [
                'username' => 'adminzipher',
                'email' => 'admin@zipher.local',
                'password' => 'admin12345',
                'role' => 'admin',
                'is_banned' => false,
            ],
            [
                'username' => 'testuser',
                'email' => 'test@example.com',
                'password' => 'password',
                'role' => 'user',
                'is_banned' => false,
            ],
            [
                'username' => 'banneduser',
                'email' => 'banned@example.com',
                'password' => 'password',
                'role' => 'user',
                'is_banned' => true,
            ],
        ];

        foreach ($seedUsers as $seedUser) {
            $user = User::query()->updateOrCreate(
                ['email' => $seedUser['email']],
                [
                    'username' => $seedUser['username'],
                    'password' => Hash::make($seedUser['password']),
                    'email_verified_at' => now(),
                ]
            );

            $user->forceFill([
                'role' => $seedUser['role'],
                'is_banned' => $seedUser['is_banned'],
            ])->save();
        }

        User::factory(10)->create();
    }
}
