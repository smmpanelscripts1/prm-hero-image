<?php

namespace Prm\HeroImage;

use Flarum\User\Event\Deleted;
use Illuminate\Contracts\Filesystem\Factory;

class DeleteProfileHeroOnUserDeleted
{
    public function handle(Deleted $event): void
    {
        $path = (string) ($event->user->profile_hero_path ?? '');

        if ($path === '' || ! str_starts_with($path, 'profile-heroes/')) {
            return;
        }

        $disk = resolve(Factory::class)->disk('flarum-assets');

        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }
}
