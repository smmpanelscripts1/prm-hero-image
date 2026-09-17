(function () {
var app = flarum.core.compat['forum/app'] || flarum.core.compat.app;
var WelcomeHero = flarum.core.compat['forum/components/WelcomeHero'];
var UserCard = flarum.core.compat['forum/components/UserCard'];
var UserControls = flarum.core.compat['forum/utils/UserControls'];
var User = flarum.core.compat['common/models/User'];
var Model = flarum.core.compat['common/Model'];
var Button = flarum.core.compat['common/components/Button'];
var extend = (flarum.core.compat['common/extend'] || {}).extend;
var m = window.m;

function t(key) {
  return app.translator.trans('prm-hero-image.forum.' + key);
}

function cssUrl(url) {
  return String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function findChildByClass(node, token) {
  if (!node) {
    return null;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var found = findChildByClass(node[i], token);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (node.attrs && node.attrs.className && String(node.attrs.className).indexOf(token) !== -1) {
    return node;
  }
  return findChildByClass(node.children, token);
}

function isProfileHero(component) {
  var className = (component.attrs && component.attrs.className) || '';
  return className.indexOf('UserHero') !== -1;
}

function uploadProfileHero(user, file) {
  if (!file) {
    return;
  }
  var data = new FormData();
  data.append('image', file);
  app
    .request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/users/' + user.id() + '/profile-hero',
      body: data,
    })
    .then(function (response) {
      user.pushAttributes({ profileHeroUrl: (response && response.url) || '' });
      m.redraw();
    });
}

function removeProfileHero(user) {
  app
    .request({
      method: 'DELETE',
      url: app.forum.attribute('apiUrl') + '/users/' + user.id() + '/profile-hero',
    })
    .then(function () {
      user.pushAttributes({ profileHeroUrl: '' });
      m.redraw();
    });
}

function pickProfileHero(user) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/webp';
  input.hidden = true;
  input.onchange = function () {
    var file = input.files && input.files[0];
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    uploadProfileHero(user, file);
  };
  document.body.appendChild(input);
  input.click();
}

function applyProfileHero(component, vnode) {
  var user = component.attrs && component.attrs.user;
  if (!user || !vnode || !isProfileHero(component)) {
    return vnode;
  }

  var url = (user.profileHeroUrl && user.profileHeroUrl()) || '';
  var banner = findChildByClass(vnode, 'XfUserCard-banner');
  var target = banner || vnode;

  target.attrs = target.attrs || {};
  if (url) {
    target.attrs.className = String(target.attrs.className || '') + ' has-profile-hero';
    target.attrs.style = Object.assign({}, target.attrs.style || {}, {
      backgroundImage: 'linear-gradient(180deg, rgba(12,16,20,0.12) 0%, rgba(12,16,20,0.52) 100%), url("' + cssUrl(url) + '")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });
  }

  return vnode;
}

WelcomeHero.prototype.view = function () {
  var url = app.forum.attribute('heroImageUrl');
  var overlay = Number(app.forum.attribute('heroImageOverlay'));
  if (isNaN(overlay)) {
    overlay = 35;
  }
  overlay = Math.min(80, Math.max(0, overlay));

  return m('header.Hero.WelcomeHero.HeroImage', [
    url ? m('div.HeroImage-media', { style: { backgroundImage: 'url(' + url + ')' } }) : m('div.HeroImage-media'),
    m('div.HeroImage-dim', { style: { opacity: String(overlay / 100) } }),
  ]);
};

WelcomeHero.prototype.isHidden = function () {
  return false;
};

app.initializers.add(
  'prm-hero-image',
  function () {
    if (User && Model) {
      User.prototype.profileHeroUrl = Model.attribute('profileHeroUrl');
      User.prototype.canEditProfileHero = Model.attribute('canEditProfileHero');
    }

    if (UserCard) {
      var original = UserCard.prototype.view;
      UserCard.prototype.view = function () {
        return applyProfileHero(this, original.call(this));
      };
    }

    if (UserControls && extend) {
      extend(UserControls, 'userControls', function (items, user) {
        if (!user || !user.canEditProfileHero || !user.canEditProfileHero()) {
          return;
        }

        items.add(
          'profile-hero-upload',
          m(
            Button,
            {
              icon: 'fas fa-image',
              onclick: function () {
                pickProfileHero(user);
              },
            },
            t('upload')
          ),
          70
        );

        if (user.profileHeroUrl && user.profileHeroUrl()) {
          items.add(
            'profile-hero-remove',
            m(
              Button,
              {
                icon: 'fas fa-times',
                onclick: function () {
                  removeProfileHero(user);
                },
              },
              t('remove')
            ),
            69
          );
        }
      });
    }
  },
  -50
);

module.exports = {};
})();
