import {Injectable} from '@angular/core';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {environment} from '../../environments/environment';

@Injectable()
export class UrlService {

  private static DEMO_FRAGMENT = 'github.io/demo/';
  private static OVERBAARD_FRAGMENT = 'overbaard';
  static readonly OVERBAARD_REST_PREFIX = 'rest/' + UrlService.OVERBAARD_FRAGMENT + '/1.0';

  private readonly _urlServiceState: UrlServiceState;

  constructor() {
    const location: Location = window.location;
    let demo = false;
    let jiraUrl: string = null;
    let overbaardPrefix: string = null;
    const localDebug = location.hostname === 'localhost' && location.port === '4200';

    if (environment.demo) {
      demo = true;
      const index: number = location.href.indexOf(UrlService.DEMO_FRAGMENT);
      overbaardPrefix = index >= 0 ? location.href.substring(0, index + UrlService.DEMO_FRAGMENT.length) : null;
    } else {
      const index: number = location.href.indexOf('/' + UrlService.OVERBAARD_FRAGMENT + '/');
      overbaardPrefix = index >= 0 ? location.href.substr(0, index) + '/' : null;
    }

    if (overbaardPrefix) {
      jiraUrl = overbaardPrefix;
    } else if (localDebug) {
      // Return the locally running Jira instance since this is still where the icons etc are loaded from
      jiraUrl =  'http://localhost:2990/jira/';
    }

    console.log('Environment:');
    console.log(environment);
    console.log('Url Service State:');
    console.log(this._urlServiceState);

    this._urlServiceState = STATE_FACTORY({
      overbaardPrefix: overbaardPrefix,
      localDebug: localDebug,
      jiraUrl: jiraUrl,
      demo: demo
    });
  }

  get jiraUrl(): string {
    return this._urlServiceState.jiraUrl;
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
    } else if (this._urlServiceState.demo) {
      return this._urlServiceState.overbaardPrefix + '/assets/images/' + imageName;
    } else {
      return this._urlServiceState.overbaardPrefix + 'overbaard/assets/images/' + imageName;
    }
  }

  caclulateRestUrl(path: string): string {
    if (this._urlServiceState.localDebug || this._urlServiceState.demo) {
      if (this._urlServiceState.demo) {
        path = path.replace('rest/', 'demo/');
      }
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
  demo: boolean;
}

interface UrlServiceStateRecord extends TypedRecord<UrlServiceStateRecord>, UrlServiceState {
}

const STATE_FACTORY = makeTypedFactory<UrlServiceState, UrlServiceStateRecord>({
  overbaardPrefix: '',
  localDebug: false,
  jiraUrl: '',
  demo: false
});
