<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\FileKeyword;
use App\Models\FileTag;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AutoTaggingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['scout.driver' => null]);
    }

    public function test_it_stores_client_generated_tags_and_keywords_for_document_files()
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'storage_limit' => 1024 * 1024 * 100
        ]);
        $this->actingAs($user);

        $file = UploadedFile::fake()->create('test_content.txt', 100);
        $tags = [
            ['name' => 'financial', 'score' => 8.5],
            ['name' => 'reports', 'score' => 7.25],
            ['name' => 'strategy', 'score' => 6.75],
        ];
        $keywords = ['financial', 'reports', 'strategy'];

        $response = $this->postJson('/api/v1/files/upload', [
            'file' => $file,
            'name' => 'test_content.txt',
            'mime_type' => 'text/plain',
            'aes_key_encrypted' => 'mock_key',
            'tags' => $tags,
            'keywords' => json_encode($keywords),
        ]);

        if ($response->status() !== 201) {
            fwrite(STDERR, print_r($response->json(), TRUE));
        }
        $response->assertStatus(201);
        $fileData = $response->json('data');
        
        $this->assertNotEmpty($fileData['tags'], "Tags should be stored");
        
        $storedTags = FileTag::where('file_id', $fileData['id'])->pluck('name')->toArray();
        $this->assertContains('financial', $storedTags);
        $this->assertContains('reports', $storedTags);
        $this->assertContains('strategy', $storedTags);

        $storedKeywords = FileKeyword::where('file_id', $fileData['id'])->pluck('keyword')->toArray();
        $this->assertSame($keywords, $storedKeywords);
    }

    public function test_it_does_not_store_tags_when_none_are_provided()
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'storage_limit' => 1024 * 1024 * 100
        ]);
        $this->actingAs($user);

        $file = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/api/v1/files/upload', [
            'file' => $file,
            'name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'aes_key_encrypted' => 'mock_key',
        ]);

        $response->assertStatus(201);
        $fileData = $response->json('data');
        
        $this->assertEmpty($fileData['tags'], "Tags should not be stored when none are provided");
    }
}
