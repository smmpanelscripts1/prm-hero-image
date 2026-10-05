<?php

namespace Prm\HeroImage\Api;

use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Factory;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteHeroImageController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected Factory $filesystem
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $current = (string) $this->settings->get('prm-hero-image.path', '');
        $disk = $this->filesystem->disk('flarum-assets');

        if ($current !== '' && ! preg_match('#^https?://#i', $current) && $disk->exists($current)) {
            $disk->delete($current);
        }

        $this->settings->set('prm-hero-image.path', '');

        return new EmptyResponse(204);
    }
}
