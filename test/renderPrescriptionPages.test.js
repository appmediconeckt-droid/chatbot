import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrescriptionPages } from '../src/Component/common/renderPrescriptionPages.js';

for (const count of [1, 2, 3]) {
  test(`${count} prepared prescription pages export consecutively without blank pages`, async () => {
    const output = [[]];
    const pdf = {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addPage() { output.push([]); },
      addImage(image, type, x, y, width, height) {
        assert.deepEqual([type, x, y, width, height], ['JPEG', 0, 0, 210, 297]);
        output.at(-1).push(image);
      },
    };
    const pages = Array.from({ length: count }, (_, index) => `page-${index + 1}`);
    await renderPrescriptionPages(pdf, pages, async page => ({
      width: 794, height: 1122, toDataURL: () => page,
    }));
    assert.deepEqual(output, pages.map(page => [page]));
  });
}
