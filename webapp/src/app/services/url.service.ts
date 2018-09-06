import {Injectable} from '@angular/core';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardState} from '../model/board/data/board';

@Injectable()
export class UrlService {

  private static OVERBAARD_FRAGMENT = 'overbaard';
  static readonly OVERBAARD_REST_PREFIX = 'rest/' + UrlService.OVERBAARD_FRAGMENT + '/1.0';

  private readonly _urlServiceState: UrlServiceState;

  constructor() {
    const location: Location = window.location;
    const index: number = location.href.indexOf('/' + UrlService.OVERBAARD_FRAGMENT + '/');

    const overbaardPrefix: string = index >= 0 ? location.href.substr(0, index) + '/' : null;
    if (!overbaardPrefix) {
      console.error('Could not determine the overbård prefix');
      console.log(`Location: ${location}`);
      console.log(`Index of /'${UrlService.OVERBAARD_FRAGMENT}'/ : ${index}`);
    }
    const localDebug: boolean = location.hostname === 'localhost' && location.port === '4200';

    let jiraUrl: string = null;
    if (overbaardPrefix) {
      jiraUrl = overbaardPrefix;
    } else if (localDebug) {
      // Return the locally running Jira instance since this is still where the icons etc are loaded from
      jiraUrl =  'http://localhost:2990/jira/';
    }
    console.log(`Overbård prefix ${overbaardPrefix}`);
    console.log(`Jira url ${jiraUrl}`);
    console.log(`localDebug ${localDebug}`);

    this._urlServiceState = STATE_FACTORY({
      overbaardPrefix: overbaardPrefix,
      localDebug: localDebug,
      jiraUrl: jiraUrl
    });
  }

  set jiraUrl(url: string) {
    // TODO remove this when https://github.com/overbaard/overbaard/issues/32 is verified to work
    console.error(new Error('Attempt was made to set jiraUrl'));
  }

  get jiraUrl(): string {
    const url = this._urlServiceState.jiraUrl;
    if (url.indexOf('null') >= 0) {
      // TODO remove this when https://github.com/overbaard/overbaard/issues/32 is verified to work
      console.error(new Error('url contains "null": ' + url));
    }
    return url;
  }


  /**
   * We need to do a little trick here since angular-cli's version of webpack does not seem to do proper replacements
   * of <image src=''>.
   * A relative path to the image works properly in 'ng serve' but when run from the plugin it takes the leading
   * '..' into account. For example if the index page is at http://localhost:2990/jira/overbaard/ and we do
   * <img src='../assets/images/test.png'> what is used is http://localhost:2990/jira/assets/images/test.png.
   * What should be used is http://localhost:2990/jira/overbaard/assets/images/test.png.
   *
   * This method should be used as well as <img src={{localImageUrl('test.png')}}> and it will do a proper replace
   * at runtime.
   *
   * @param {string} imageName
   * @return {string} the correct path to the image for the environment
   */
  localImageUrl(imageName: string): string {
    if (this._urlServiceState.localDebug) {
      return '/assets/images/' + imageName;
    } else {
      return this._urlServiceState.overbaardPrefix + 'overbaard/assets/images/' + imageName;
    }
  }

  caclulateRestUrl(path: string): string {
    if (this._urlServiceState.localDebug) {
      // For the local debugging of the UI, which does not seem to like loading json without a .json suffix
      const index = path.indexOf('?');
      if (index > 0) {
        path = path.substr(0, index);
      }
      return path + '.json';
    }
    return this._urlServiceState.overbaardPrefix + path;
  }
}

interface UrlServiceState {
  overbaardPrefix: string;
  localDebug: boolean;
  jiraUrl: string;
}

interface UrlServiceStateRecord extends TypedRecord<UrlServiceStateRecord>, UrlServiceState {
}

const STATE_FACTORY = makeTypedFactory<UrlServiceState, UrlServiceStateRecord>({
  overbaardPrefix: '',
  localDebug: false,
  jiraUrl: ''
});
