(function () {
var app = flarum.core.compat['admin/app'] || flarum.core.compat.app;
var ExtensionPage = flarum.core.compat['admin/components/ExtensionPage'];
var Button = flarum.core.compat['common/components/Button'];
var saveSettings = flarum.core.compat['admin/utils/saveSettings'];
var m = window.m;

function t(key) {
  return app.translator.trans('prm-hero-image.admin.' + key);
}

function imageUrl(path) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  var base = (app.forum && app.forum.attribute('assetsBaseUrl')) || '';
  return String(base).replace(/\/$/, '') + '/' + String(path).replace(/^\//, '');
}

class HeroImagePage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.uploading = false;
    this.saving = false;
    this.saved = false;
    this.path = app.data.settings['prm-hero-image.path'] || '';
    this.overlay = String(app.data.settings['prm-hero-image.overlay'] || '35');
  }

  content() {
    var self = this;
    var url = imageUrl(this.path);

    return m('div.ExtensionPage-settings', m('div.container', [
      m('p.helpText', t('help')),
      m('p.helpText', t('profile_help')),
      m('div.HeroImageAdmin-preview', url
        ? [
            m('div.HeroImageAdmin-preview-media', { style: { backgroundImage: 'url(' + url + ')', backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' } }),
            m('div.HeroImageAdmin-preview-dim', { style: { opacity: String(Number(this.overlay) / 100) } }),
          ]
        : m('div.HeroImageAdmin-preview-empty', t('preview_empty'))
      ),
      m('div.Form-group', [
        m('label', t('upload_label')),
        m('p.helpText', t('upload_help')),
        m('div.HeroImageAdmin-row', [
          m('input.HeroImageAdmin-file', {
            type: 'file',
            accept: 'image/png,image/jpeg,image/gif,image/webp',
            onchange: function (e) {
              self.upload(e.target.files[0], e.target);
            },
          }),
          m(
            Button,
            {
              className: 'Button Button--primary',
              icon: 'fas fa-upload',
              loading: this.uploading,
              onclick: function (e) {
                e.currentTarget.parentNode.querySelector('input[type=file]').click();
              },
            },
            t('upload_button')
          ),
          this.path
            ? m(
                Button,
                {
                  className: 'Button Button--danger',
                  icon: 'fas fa-trash',
                  onclick: function () {
                    self.remove();
                  },
                },
                t('remove_button')
              )
            : null,
        ]),
      ]),
      m('div.Form-group', [
        m('label', t('overlay_label') + ' (' + this.overlay + '%)'),
        m('p.helpText', t('overlay_help')),
        m('input.FormControl.HeroImageAdmin-overlay', {
          type: 'range',
          min: '10',
          max: '70',
          step: '1',
          value: this.overlay,
          oninput: function (e) {
            self.overlay = e.target.value;
            self.saved = false;
          },
        }),
      ]),
      m(
        Button,
        {
          className: 'Button Button--primary',
          loading: this.saving,
          onclick: function () {
            self.saveOverlay();
          },
        },
        this.saved ? t('saved') : app.translator.trans('core.admin.settings.submit_button')
      ),
    ]));
  }

  upload(file, input) {
    if (!file) {
      return;
    }
    var self = this;
    var data = new FormData();
    data.append('image', file);
    this.uploading = true;

    app
      .request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/prm-hero-image',
        body: data,
      })
      .then(function (response) {
        self.path = (response && response.path) || '';
        app.data.settings['prm-hero-image.path'] = self.path;
        self.uploading = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      })
      .catch(function () {
        self.uploading = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      });
  }

  remove() {
    var self = this;
    app
      .request({
        method: 'DELETE',
        url: app.forum.attribute('apiUrl') + '/prm-hero-image',
      })
      .then(function () {
        self.path = '';
        app.data.settings['prm-hero-image.path'] = '';
        m.redraw();
      });
  }

  saveOverlay() {
    var self = this;
    this.saving = true;
    saveSettings({
      'prm-hero-image.overlay': String(this.overlay),
    }).then(function () {
      self.saving = false;
      self.saved = true;
      m.redraw();
    }).catch(function () {
      self.saving = false;
      m.redraw();
    });
  }
}

app.initializers.add('prm-hero-image', function () {
  app.extensionData
    .for('prm-hero-image')
    .registerPage(HeroImagePage)
    .registerPermission(
      {
        icon: 'fas fa-image',
        label: app.translator.trans('prm-hero-image.admin.permissions.profile_hero_label'),
        permission: 'user.profileHero',
      },
      'start'
    );
});

module.exports = {};
})();
