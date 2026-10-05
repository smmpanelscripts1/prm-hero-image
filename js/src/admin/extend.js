import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';
import HeroImagePage from './components/HeroImagePage';

export default [
  new Extend.Admin()
    .page(HeroImagePage)
    .permission(
      () => ({
        icon: 'fas fa-image',
        label: app.translator.trans('prm-hero-image.admin.permissions.profile_hero_label'),
        permission: 'user.profileHero',
      }),
      'start'
    ),
];
