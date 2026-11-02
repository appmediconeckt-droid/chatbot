// Measure the rendered letterhead so every exported page reserves the same space.
export function paginatePrescription(root) {
  const original = root.querySelector('.prescription-document');
  const source = original.querySelector('.prescription-body');
  const pages = [];
  const newPage = () => {
    const page = original.cloneNode(true);
    page.classList.add('prescription-paper-page');
    const body = page.querySelector('.prescription-body');
    body.replaceChildren();
    root.appendChild(page);
    pages.push(page);
    return body;
  };
  let body = newPage();
  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  const append = node => {
    body.appendChild(node);
    if (fits()) return;
    node.remove();
    if (body.childNodes.length) body = newPage();
    body.appendChild(node);
    if (!fits()) throw new Error('A prescription entry is too long for one page. Please shorten the entry and try again.');
  };
  try {
    for (const section of source.children) {
      const table = section.querySelector('table');
      if (table) {
        let copy;
        let tbody;
        const startTable = () => {
          copy = section.cloneNode(true);
          tbody = copy.querySelector('tbody');
          tbody.replaceChildren();
          append(copy);
        };
        startTable();
        for (const row of table.querySelectorAll('tbody > tr')) {
          const clone = row.cloneNode(true);
          tbody.appendChild(clone);
          if (fits()) continue;
          clone.remove();
          if (!tbody.children.length) copy.remove();
          body = newPage();
          startTable();
          tbody.appendChild(clone);
          if (!fits()) throw new Error('A medicine entry is too long for one page. Please shorten the entry and try again.');
        }
      } else {
        append(section.cloneNode(true));
      }
    }
    original.remove();
  } catch (error) {
    pages.forEach(page => page.remove());
    throw error;
  }
}
