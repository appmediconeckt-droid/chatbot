const { build } = require('esbuild');
const path = require('node:path');

async function check() {
  const result = await build({
    stdin: { resolveDir: path.join(__dirname, '..'), loader: 'jsx', contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import assert from 'node:assert/strict';
      import Choices from './src/Component/common/ProviderPaymentChoices.jsx';
      const cash = { id: 'cash', label: 'Cash', icon: 'fa-money-bill-wave' };
      const upi = { id: 'upi', label: 'UPI', icon: 'fa-mobile-screen-button' };
      const render = options => renderToStaticMarkup(<Choices options={options} value="cash" onChange={() => {}} />);
      const unavailable = render({ methods: [cash], displayMethods: [cash, { ...upi, unavailableReason: 'Online payment is unavailable for EUR.' }] });
      assert.match(unavailable, />Cash</);
      assert.match(unavailable, />UPI</);
      assert.match(unavailable, /unavailable for EUR/);
      assert.equal((unavailable.match(/disabled=""/g) || []).length, 1);
      const ready = render({ methods: [cash, upi], displayMethods: [cash, upi] });
      assert.doesNotMatch(ready, /disabled=""|unavailable/);
      assert.doesNotMatch(render({ methods: [cash] }), />UPI</);
      const upiMarkup = renderToStaticMarkup(<Choices options={{ methods: [upi] }} value="upi" onChange={() => {}} />);
      assert.equal((upiMarkup.match(/type="radio"/g) || []).length, 5);
      assert.match(upiMarkup, /Choose your UPI app/);
      const cards = [{ id: 'credit_card', label: 'Credit Card', icon: 'fa-credit-card' }, { id: 'debit_card', label: 'Debit Card', icon: 'fa-credit-card' }];
      const cardMarkup = renderToStaticMarkup(<Choices options={{ methods: cards }} value="credit_card" onChange={() => {}} />);
      assert.equal(cardMarkup.split('Credit / Debit Card').length - 1, 1);
      assert.match(cardMarkup, /VISA/);
      assert.match(cardMarkup, /mastercard/);
      assert.match(cardMarkup, /secure checkout/);
      assert.match(cardMarkup, /Enter card details/);
      assert.doesNotMatch(cardMarkup, /name="(?:cardNumber|cvv)"/);
      console.log('PASS: saved methods stay visible, unavailable methods explain why and cannot be selected, and unselected methods stay hidden.');
    ` },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: { '.css': 'empty' },
    plugins: [{ name: 'payment-test-adapter', setup(builder) {
      builder.onResolve({ filter: /utils\/providerPayments\.js$/ }, () => ({ path: 'payment', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: "export const isOnlinePayment = method => ['credit_card','debit_card','upi'].includes(method);", loader: 'js' }));
    } }],
  });
  new Function('require', result.outputFiles[0].text)(require);
}
check().catch(error => { console.error(error); process.exitCode = 1; });
