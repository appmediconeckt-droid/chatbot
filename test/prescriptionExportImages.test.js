import test from 'node:test';
import assert from 'node:assert/strict';
import { embedPrescriptionImages } from '../src/Component/common/prescriptionExportImages.js';

function fixture({ broken = false, tainted = false } = {}) {
  let loads = 0;
  let draws = 0;
  class Image {
    naturalWidth = 128;
    naturalHeight = 128;
    set src(value) {
      assert.equal(this.crossOrigin, 'anonymous');
      loads++;
      queueMicrotask(() => broken ? this.onerror() : this.onload());
    }
    async decode() {}
  }
  const elements = [1, 2].map(() => ({
    src: '/assets/humaeli-logo-icon.png',
    removeAttribute() {},
    async decode() { assert.match(this.src, /^data:image\/png;base64,/); this.decoded = true; },
  }));
  const root = {
    ownerDocument: {
      defaultView: { Image },
      createElement: () => ({
        getContext: () => ({ drawImage() { draws++; } }),
        toDataURL() { if (tainted) throw new Error('SecurityError'); return 'data:image/png;base64,bG9nbw=='; },
      }),
    },
    querySelectorAll: () => elements,
  };
  return { root, elements, counts: () => ({ loads, draws }) };
}

test('footer and watermark sharing a logo are embedded and decoded before capture', async () => {
  const { root, elements, counts } = fixture();
  await embedPrescriptionImages(root);
  assert.deepEqual(counts(), { loads: 1, draws: 1 });
  for (const image of elements) {
    assert.equal(image.src, 'data:image/png;base64,bG9nbw==');
    assert.equal(image.loading, 'eager');
    assert.equal(image.decoded, true);
  }
});

test('a missing logo fails export instead of silently producing a PDF without it', async () => {
  await assert.rejects(embedPrescriptionImages(fixture({ broken: true }).root), /image could not be loaded/);
});

test('an image that cannot be embedded fails export instead of disappearing', async () => {
  await assert.rejects(embedPrescriptionImages(fixture({ tainted: true }).root), /image could not be loaded/);
});
