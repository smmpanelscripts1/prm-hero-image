<?php

namespace Prm\HeroImage;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Api\Serializer\UserSerializer;
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

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(function (ForumSerializer $serializer) {
            $settings = resolve(SettingsRepositoryInterface::class);
            $path = trim((string) $settings->get('prm-hero-image.path', ''));
            $overlay = (int) $settings->get('prm-hero-image.overlay', 35);
            $overlay = max(0, min(80, $overlay));

            $url = '';
            if ($path !== '') {
                if (preg_match('#^https?://#i', $path)) {
                    $url = $path;
                } else {
                    $url = resolve(Factory::class)->disk('flarum-assets')->url($path);
                }
            }

            return [
                'heroImageUrl' => $url,
                'heroImageOverlay' => $overlay,
            ];
        }),

    (new Extend\ApiSerializer(UserSerializer::class))
        ->attributes(function (UserSerializer $serializer, User $user) {
            $path = trim((string) ($user->profile_hero_path ?? ''));
            $url = '';

            if ($path !== '' && str_starts_with($path, 'profile-heroes/')) {
                $url = resolve(Factory::class)->disk('flarum-assets')->url($path);
            }

            return [
                'profileHeroUrl' => $url,
                'canEditProfileHero' => $serializer->getActor()->can('uploadProfileHero', $user),
            ];
        }),
];
