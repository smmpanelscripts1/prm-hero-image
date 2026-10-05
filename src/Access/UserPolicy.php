<?php

namespace Prm\HeroImage\Access;

use Flarum\User\Access\AbstractPolicy;
use Flarum\User\User;

class UserPolicy extends AbstractPolicy
{
    public function uploadProfileHero(User $actor, User $user)
    {
        if ($actor->isGuest()) {
            return $this->deny();
        }

        if (! empty($actor->suspended_until) && $actor->suspended_until->isFuture()) {
            return $this->deny();
        }

        if ($actor->isAdmin()) {
            return $this->allow();
        }

        if ((int) $actor->id === (int) $user->id && $actor->hasPermission('user.profileHero')) {
            return $this->allow();
        }
    }
}
