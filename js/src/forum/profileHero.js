import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';

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
    for (let i = 0; i < node.length; i++) {
      const found = findChildByClass(node[i], token);
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
  const className = (component.attrs && component.attrs.className) || '';
  return className.indexOf('UserHero') !== -1;
}

export function uploadProfileHero(user, file) {
  if (!file) {
    return;
  }
  const data = new FormData();
  data.append('image', file);
  app
    .request({
      method: 'POST',
      url: app.forum.attribute('apiUrl') + '/users/' + user.id() + '/profile-hero',
      body: data,
    })
    .then((response) => {
      user.pushAttributes({ profileHeroUrl: (response && response.url) || '' });
      m.redraw();
    });
}

export function removeProfileHero(user) {
  app
    .request({
      method: 'DELETE',
      url: app.forum.attribute('apiUrl') + '/users/' + user.id() + '/profile-hero',
    })
    .then(() => {
      user.pushAttributes({ profileHeroUrl: '' });
      m.redraw();
    });
}

export function pickProfileHero(user) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/webp';
  input.hidden = true;
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    uploadProfileHero(user, file);
  };
  document.body.appendChild(input);
  input.click();
}

export function applyProfileHero(component, vnode) {
  const user = component.attrs && component.attrs.user;
  if (!user || !vnode || !isProfileHero(component)) {
    return vnode;
  }

  const url = (user.profileHeroUrl && user.profileHeroUrl()) || '';
  const banner = findChildByClass(vnode, 'XfUserCard-banner');
  const target = banner || vnode;

  target.attrs = target.attrs || {};
  if (url) {
    target.attrs.className = String(target.attrs.className || '') + ' has-profile-hero';
    target.attrs.style = Object.assign({}, target.attrs.style || {}, {
      backgroundImage:
        'linear-gradient(180deg, rgba(12,16,20,0.12) 0%, rgba(12,16,20,0.52) 100%), url("' + cssUrl(url) + '")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });
  }

  return vnode;
}

export function addProfileHeroControls(items, user) {
  if (!user || !user.canEditProfileHero || !user.canEditProfileHero()) {
    return;
  }

  items.add(
    'profile-hero-upload',
    <Button
      icon="fas fa-image"
      onclick={() => {
        pickProfileHero(user);
      }}
    >
      {t('upload')}
    </Button>,
    70
  );

  if (user.profileHeroUrl && user.profileHeroUrl()) {
    items.add(
      'profile-hero-remove',
      <Button
        icon="fas fa-times"
        onclick={() => {
          removeProfileHero(user);
        }}
      >
        {t('remove')}
      </Button>,
      69
    );
  }
}
