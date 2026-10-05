import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import saveSettings from 'flarum/admin/utils/saveSettings';

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
  const base = (app.forum && app.forum.attribute('assetsBaseUrl')) || '';
  return String(base).replace(/\/$/, '') + '/' + String(path).replace(/^\//, '');
}

export default class HeroImagePage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.uploading = false;
    this.saving = false;
    this.saved = false;
    this.path = app.data.settings['prm-hero-image.path'] || '';
    this.overlay = String(app.data.settings['prm-hero-image.overlay'] || '35');
  }

  content() {
    const url = imageUrl(this.path);

    return (
      <div className="ExtensionPage-settings">
        <div className="container">
          <p className="helpText">{t('help')}</p>
          <p className="helpText">{t('profile_help')}</p>
          <div className="HeroImageAdmin-preview">
            {url ? (
              <>
                <div
                  className="HeroImageAdmin-preview-media"
                  style={{ backgroundImage: 'url(' + url + ')', backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }}
                />
                <div className="HeroImageAdmin-preview-dim" style={{ opacity: String(Number(this.overlay) / 100) }} />
              </>
            ) : (
              <div className="HeroImageAdmin-preview-empty">{t('preview_empty')}</div>
            )}
          </div>
          <div className="Form-group">
            <label>{t('upload_label')}</label>
            <p className="helpText">{t('upload_help')}</p>
            <div className="HeroImageAdmin-row">
              <input
                className="HeroImageAdmin-file"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onchange={(e) => this.upload(e.target.files[0], e.target)}
              />
              <Button
                className="Button Button--primary"
                icon="fas fa-upload"
                loading={this.uploading}
                onclick={(e) => e.currentTarget.parentNode.querySelector('input[type=file]').click()}
              >
                {t('upload_button')}
              </Button>
              {this.path ? (
                <Button className="Button Button--danger" icon="fas fa-trash" onclick={() => this.remove()}>
                  {t('remove_button')}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="Form-group">
            <label>
              {t('overlay_label')} ({this.overlay}%)
            </label>
            <p className="helpText">{t('overlay_help')}</p>
            <input
              className="FormControl HeroImageAdmin-overlay"
              type="range"
              min="10"
              max="70"
              step="1"
              value={this.overlay}
              oninput={(e) => {
                this.overlay = e.target.value;
                this.saved = false;
              }}
            />
          </div>
          <Button className="Button Button--primary" loading={this.saving} onclick={() => this.saveOverlay()}>
            {this.saved ? t('saved') : app.translator.trans('core.admin.settings.submit_button')}
          </Button>
        </div>
      </div>
    );
  }

  upload(file, input) {
    if (!file) {
      return;
    }
    const data = new FormData();
    data.append('image', file);
    this.uploading = true;

    app
      .request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/prm-hero-image',
        body: data,
      })
      .then((response) => {
        this.path = (response && response.path) || '';
        app.data.settings['prm-hero-image.path'] = this.path;
        this.uploading = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      })
      .catch(() => {
        this.uploading = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      });
  }

  remove() {
    app
      .request({
        method: 'DELETE',
        url: app.forum.attribute('apiUrl') + '/prm-hero-image',
      })
      .then(() => {
        this.path = '';
        app.data.settings['prm-hero-image.path'] = '';
        m.redraw();
      });
  }

  saveOverlay() {
    this.saving = true;
    saveSettings({
      'prm-hero-image.overlay': String(this.overlay),
    })
      .then(() => {
        this.saving = false;
        this.saved = true;
        m.redraw();
      })
      .catch(() => {
        this.saving = false;
        m.redraw();
      });
  }
}
