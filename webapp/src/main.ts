import {enableDebugTools} from '@angular/platform-browser';
import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

const __webpack_public_path__ = calculatePublicPath();
console.log('Calculated webpack public path: ' + __webpack_public_path__);


function calculatePublicPath(): string {
  const searchElement = '/overbaard/';
  const location: Location = window.location;
  const href: string = location.href;
  const index: number = href.indexOf(searchElement);
  if (index < 0) {
    // We are running in a test server setup
    let url: string = location.protocol + '//';
    url += location.hostname;
    if (location.port) {
      url += ':' + location.port;
    }
    url += '/';
    return url;
  } else {
    // We are running in the plugin
    return href.substr(0, index) + '/';
  }
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then((ref: any) => {
  enableDebugTools(ref);
});
