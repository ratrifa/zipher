<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use Meilisearch\Client;

#[Signature('search:setup')]
#[Description('Configure Meilisearch settings like filterable attributes')]
class SearchSetupCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $host = config('scout.meilisearch.host');
        $key  = config('scout.meilisearch.key');

        $this->info("Connecting to Meilisearch at $host...");
        $client = new Client($host, $key);

        $indexes = ['files', 'folders'];

        foreach ($indexes as $indexName) {
            $this->info("Configuring index: $indexName...");
            $index = $client->index($indexName);

            $filterableAttributes = ['user_id'];
            if ($indexName === 'files') {
                $filterableAttributes[] = 'file_category';
                $filterableAttributes[] = 'mime_type';
            }

            $index->updateFilterableAttributes($filterableAttributes);
            $this->info("Filterable attributes updated for $indexName.");
        }

        $this->info("Search setup complete!");
    }
}
