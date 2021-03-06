/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');
const waitUntil = require('../../../infra/testing/wait-until');

describe(`cacheableResponse.Plugin`, function() {
  const baseURL = `${global.__workbox.server.getAddress()}/test/workbox-cacheable-response/static/cacheable-response-plugin/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseURL}integration.html`);
  });

  it(`should load a page and cache entries`, async function() {
    const swURL = `${baseURL}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    let error = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
    });
    if (error) {
      throw new Error(error);
    }

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await waitUntil(async () => {
      const keys = await runInSW('cachesKeys');
      return keys.length > 0;
    });

    const keys = await runInSW('cachesKeys');
    expect(keys).to.deep.equal([
      'cacheable-response-cache',
    ]);

    let cachedRequests = await runInSW('cacheURLs', keys[0]);
    expect(cachedRequests).to.eql([
      `${baseURL}example-1.txt`,
    ]);
  });
});
