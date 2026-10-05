<?php

namespace Prm\HeroImage;

use Flarum\Foundation\ValidationException;

class SafeImage
{
    public const USER_MAX_BYTES = 2097152;
    public const ADMIN_MAX_BYTES = 3145728;
    public const MAX_WIDTH = 2560;
    public const MAX_HEIGHT = 1440;
    public const MIN_WIDTH = 200;
    public const MIN_HEIGHT = 60;

    private const MIMES = [
        'image/jpeg' => true,
        'image/png' => true,
        'image/gif' => true,
        'image/webp' => true,
    ];

    public static function toJpeg(string $binary, int $maxBytes): string
    {
        if ($binary === '' || strlen($binary) > $maxBytes) {
            throw new ValidationException(['image' => 'Görsel çok büyük veya boş.']);
        }

        $head = strtolower(substr(ltrim($binary), 0, 256));
        if (str_contains($head, '<svg') || str_contains($head, '<?php') || str_contains($head, '<html') || str_contains($head, '<script')) {
            throw new ValidationException(['image' => 'Geçersiz görsel.']);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($binary) ?: '';

        if (! isset(self::MIMES[$mime])) {
            throw new ValidationException(['image' => 'Sadece PNG, JPG, GIF veya WEBP yükleyebilirsin.']);
        }

        $info = @getimagesizefromstring($binary);
        if (! is_array($info) || empty($info[0]) || empty($info[1])) {
            throw new ValidationException(['image' => 'Görsel okunamadı.']);
        }

        $width = (int) $info[0];
        $height = (int) $info[1];

        if ($width < self::MIN_WIDTH || $height < self::MIN_HEIGHT) {
            throw new ValidationException(['image' => 'Görsel çok küçük.']);
        }

        if ($width > self::MAX_WIDTH || $height > self::MAX_HEIGHT || ($width * $height) > 4000000) {
            throw new ValidationException(['image' => 'Görsel en fazla '.self::MAX_WIDTH.'x'.self::MAX_HEIGHT.' olabilir.']);
        }

        $source = @imagecreatefromstring($binary);
        if (! $source) {
            throw new ValidationException(['image' => 'Görsel işlenemedi.']);
        }

        $canvas = imagecreatetruecolor($width, $height);
        if (! $canvas) {
            imagedestroy($source);
            throw new ValidationException(['image' => 'Görsel işlenemedi.']);
        }

        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $white);
        imagecopy($canvas, $source, 0, 0, 0, 0, $width, $height);
        imagedestroy($source);

        ob_start();
        $ok = imagejpeg($canvas, null, 82);
        $jpeg = (string) ob_get_clean();
        imagedestroy($canvas);

        if (! $ok || $jpeg === '') {
            throw new ValidationException(['image' => 'Görsel kaydedilemedi.']);
        }

        return $jpeg;
    }

    public static function readUpload(\Psr\Http\Message\UploadedFileInterface $file, int $maxBytes): string
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(['image' => 'Görsel yüklenemedi.']);
        }

        $size = $file->getSize();
        if (is_int($size) && $size > $maxBytes) {
            throw new ValidationException(['image' => 'Görsel çok büyük.']);
        }

        return (string) $file->getStream();
    }
}
