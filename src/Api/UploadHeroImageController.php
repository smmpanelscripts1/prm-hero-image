<?php

namespace Prm\HeroImage\Api;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Laminas\Diactoros\Response\JsonResponse;
use Prm\HeroImage\SafeImage;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;

class UploadHeroImageController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected Factory $filesystem
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $file = Arr::get($request->getUploadedFiles(), 'image');

        if (! $file instanceof UploadedFileInterface) {
            throw new ValidationException(['image' => 'Görsel yüklenemedi.']);
        }

        $jpeg = SafeImage::toJpeg(SafeImage::readUpload($file, SafeImage::ADMIN_MAX_BYTES), SafeImage::ADMIN_MAX_BYTES);
        $disk = $this->filesystem->disk('flarum-assets');
        $current = (string) $this->settings->get('prm-hero-image.path', '');

        if ($current !== '' && ! preg_match('#^https?://#i', $current) && $disk->exists($current)) {
            $disk->delete($current);
        }

        $path = 'hero-image/banner-'.Str::lower(Str::random(12)).'.jpg';
        $disk->put($path, $jpeg);
        $this->settings->set('prm-hero-image.path', $path);

        return new JsonResponse([
            'path' => $path,
        ]);
    }
}
