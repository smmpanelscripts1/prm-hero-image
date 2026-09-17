<?php

namespace Prm\HeroImage\Api;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Laminas\Diactoros\Response\JsonResponse;
use Prm\HeroImage\SafeImage;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;

class UploadProfileHeroController implements RequestHandlerInterface
{
    public function __construct(
        protected Factory $filesystem,
        protected Cache $cache
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $id = Arr::get($request->getQueryParams(), 'id');
        $user = User::query()->findOrFail($id);
        $actor->assertCan('uploadProfileHero', $user);

        $lockKey = 'prm-hero-image.profile.'.$actor->id;
        if ($this->cache->has($lockKey)) {
            throw new ValidationException(['image' => 'Çok sık yükleme yaptın. Biraz bekle.']);
        }

        $file = Arr::get($request->getUploadedFiles(), 'image');

        if (! $file instanceof UploadedFileInterface) {
            throw new ValidationException(['image' => 'Görsel yüklenemedi.']);
        }

        $jpeg = SafeImage::toJpeg(SafeImage::readUpload($file, SafeImage::USER_MAX_BYTES), SafeImage::USER_MAX_BYTES);
        $disk = $this->filesystem->disk('flarum-assets');
        $current = (string) ($user->profile_hero_path ?? '');

        if ($current !== '' && str_starts_with($current, 'profile-heroes/') && $disk->exists($current)) {
            $disk->delete($current);
        }

        $path = 'profile-heroes/'.((int) $user->id).'-'.Str::lower(Str::random(12)).'.jpg';
        $disk->put($path, $jpeg);

        $user->profile_hero_path = $path;
        $user->save();
        $this->cache->put($lockKey, 1, 15);

        return new JsonResponse([
            'url' => $disk->url($path),
        ]);
    }
}
