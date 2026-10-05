<?php

namespace Prm\HeroImage\Api;

use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteProfileHeroController implements RequestHandlerInterface
{
    public function __construct(
        protected Factory $filesystem
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $id = Arr::get($request->getQueryParams(), 'id');
        $user = User::query()->findOrFail($id);
        $actor->assertCan('uploadProfileHero', $user);

        $disk = $this->filesystem->disk('flarum-assets');
        $current = (string) ($user->profile_hero_path ?? '');

        if ($current !== '' && str_starts_with($current, 'profile-heroes/') && $disk->exists($current)) {
            $disk->delete($current);
        }

        $user->profile_hero_path = null;
        $user->save();

        return new JsonResponse([
            'url' => '',
        ]);
    }
}
