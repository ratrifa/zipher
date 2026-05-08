<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\File;
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

    public function test_it_automatically_generates_tags_for_document_files()
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'storage_limit' => 1024 * 1024 * 100 // 100MB
        ]);
        $this->actingAs($user);

        $content = "Test content";
        $file = UploadedFile::fake()->create('test_content.txt', 100);

        $response = $this->postJson('/api/v1/files/upload', [
            'file' => $file,
            'name' => 'test_content.txt',
            'mime_type' => 'text/plain',
            'aes_key_encrypted' => 'mock_key',
            'text_content' => $content,
        ]);

        if ($response->status() !== 201) {
            fwrite(STDERR, print_r($response->json(), TRUE));
        }
        $response->assertStatus(201);
        $fileData = $response->json('data');
        
        $this->assertNotEmpty($fileData['tags'], "Tags automatically generated");
        
        $tags = FileTag::where('file_id', $fileData['id'])->pluck('name')->toArray();
        $this->assertContains('financial', $tags);
        $this->assertContains('reports', $tags);
        $this->assertContains('strategy', $tags);
    }

    public function test_it_does_not_generate_tags_for_images_even_with_text_content()
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'storage_limit' => 1024 * 1024 * 100
        ]);
        $this->actingAs($user);

        $file = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg');
        $content = "text should be ignored.";

        $response = $this->postJson('/api/v1/files/upload', [
            'file' => $file,
            'name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'aes_key_encrypted' => 'mock_key',
            'text_content' => $content,
        ]);

        $response->assertStatus(201);
        $fileData = $response->json('data');
        
        $this->assertEmpty($fileData['tags'], "Tags should NOT be generated for image files");
    }
}
