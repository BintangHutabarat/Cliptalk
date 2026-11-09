<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clips', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();

            $table->string('candidate_id');
            $table->string('title', 60);
            $table->decimal('start_sec', 10, 3);
            $table->decimal('end_sec', 10, 3);

            $table->boolean('show_captions')->default(true);
            $table->string('caption_style', 20)->default('outline');

            $table->string('stage', 20)->default('draft');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->text('error')->nullable();

            $table->string('output_path')->nullable();
            $table->string('subtitle_path')->nullable();
            $table->unsignedBigInteger('output_size_bytes')->nullable();

            $table->timestamps();

            $table->index(['project_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clips');
    }
};