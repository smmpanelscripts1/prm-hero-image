import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import UserControls from 'flarum/forum/utils/UserControls';
import { addProfileHeroControls, applyProfileHero } from './profileHero';

export { default as extend } from './extend';

app.initializers.add(
  'prm-hero-image',
  () => {
    override('flarum/forum/components/WelcomeHero', 'view', function () {
      const url = app.forum.attribute('heroImageUrl');
      let overlay = Number(app.forum.attribute('heroImageOverlay'));
      if (isNaN(overlay)) {
        overlay = 35;
      }
      overlay = Math.min(80, Math.max(0, overlay));

      return (
        <header className="Hero WelcomeHero HeroImage">
          {url ? <div className="HeroImage-media" style={{ backgroundImage: 'url(' + url + ')' }} /> : <div className="HeroImage-media" />}
          <div className="HeroImage-dim" style={{ opacity: String(overlay / 100) }} />
        </header>
      );
    });

    override('flarum/forum/components/WelcomeHero', 'isHidden', function () {
      return false;
    });

    override('flarum/forum/components/UserCard', 'view', function (original) {
      return applyProfileHero(this, original());
    });

    extend(UserControls, 'userControls', function (items, user) {
      addProfileHeroControls(items, user);
    });
  },
  -50
);
