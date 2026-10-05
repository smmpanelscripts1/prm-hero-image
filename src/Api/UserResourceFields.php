<?php

namespace Prm\HeroImage\Api;

use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\User\User;
use Illuminate\Contracts\Filesystem\Factory;

class UserResourceFields
{
    public function __invoke(): array
    {
        return [
            Schema\Str::make('profileHeroUrl')
                ->get(function (User $user) {
                    $path = trim((string) ($user->profile_hero_path ?? ''));

                    if ($path === '' || ! str_starts_with($path, 'profile-heroes/')) {
                        return '';
                    }

                    return resolve(Factory::class)->disk('flarum-assets')->url($path);
                }),
            Schema\Boolean::make('canEditProfileHero')
                ->get(fn (User $user, Context $context) => $context->getActor()->can('uploadProfileHero', $user)),
        ];
    }
}
