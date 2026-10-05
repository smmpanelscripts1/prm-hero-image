<?php

namespace Prm\HeroImage;

use Flarum\Api\Context;
use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Resource\UserResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\Event\Deleted;
use Flarum\User\User;
use Illuminate\Contracts\Filesystem\Factory;
use Prm\HeroImage\Access\UserPolicy;
use Prm\HeroImage\Api\DeleteHeroImageController;
use Prm\HeroImage\Api\DeleteProfileHeroController;
use Prm\HeroImage\Api\UploadHeroImageController;
use Prm\HeroImage\Api\UploadProfileHeroController;
use Prm\HeroImage\Api\UserResourceFields;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Routes('api'))
        ->post('/prm-hero-image', 'prm-hero-image.upload', UploadHeroImageController::class)
        ->delete('/prm-hero-image', 'prm-hero-image.delete', DeleteHeroImageController::class)
        ->post('/users/{id}/profile-hero', 'prm-hero-image.profile.upload', UploadProfileHeroController::class)
        ->delete('/users/{id}/profile-hero', 'prm-hero-image.profile.delete', DeleteProfileHeroController::class),

    (new Extend\Settings())
        ->default('prm-hero-image.path', '')
        ->default('prm-hero-image.overlay', '35'),

    (new Extend\Model(User::class))
        ->cast('profile_hero_path', 'string'),

    (new Extend\Policy())
        ->modelPolicy(User::class, UserPolicy::class),

    (new Extend\Event())
        ->listen(Deleted::class, DeleteProfileHeroOnUserDeleted::class),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Str::make('heroImageUrl')
                ->get(function () {
                    $settings = resolve(SettingsRepositoryInterface::class);
                    $path = trim((string) $settings->get('prm-hero-image.path', ''));

                    if ($path === '') {
                        return '';
                    }

                    if (preg_match('#^https?://#i', $path)) {
                        return $path;
                    }

                    return resolve(Factory::class)->disk('flarum-assets')->url($path);
                }),
            Schema\Integer::make('heroImageOverlay')
                ->get(function () {
                    $overlay = (int) resolve(SettingsRepositoryInterface::class)->get('prm-hero-image.overlay', 35);

                    return max(0, min(80, $overlay));
                }),
        ]),

    (new Extend\ApiResource(UserResource::class))
        ->fields(UserResourceFields::class),
];
