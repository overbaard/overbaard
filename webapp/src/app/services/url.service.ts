import {Injectable} from '@angular/core';

@Injectable()
export class UrlService {

  private static OVERBAARD_FRAGMENT = 'overbaard';
  static readonly OVERBAARD_REST_PREFIX = 'rest/' + UrlService.OVERBAARD_FRAGMENT + '/1.0';

  private readonly _overbaardPrefix: string;
  private readonly _localDebug: boolean;
  private readonly _testRunner: boolean;
  private readonly _jiraUrl: string;

  constructor() {
    const location: Location = window.location;
    const index: number = location.href.indexOf('/' + UrlService.OVERBAARD_FRAGMENT + '/');

    this._overbaardPrefix = index >= 0 ? location.href.substr(0, index) + '/' : null;
    this._localDebug = location.hostname === 'localhost' && location.port === '4200';
    // In our current test setup the url http://localhost:9876/context.html is used by the runner
    this._testRunner = location.hostname === 'localhost' && location.port === '9876';

    if (this._overbaardPrefix) {
      this._jiraUrl = this._overbaardPrefix;
    } else if (this._localDebug) {
      // Return the locally running Jira instance since this is still where the icons etc are loaded from
      this._jiraUrl =  'http://localhost:2990/jira/';
    }
  }

  get jiraUrl(): string {
    return this._jiraUrl;
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
    if (this._localDebug) {
      return '/assets/images/' + imageName;
    } else {
      return this._overbaardPrefix + 'overbaard/assets/images/' + imageName;
    }
  }

  caclulateRestUrl(path: string): string {
    if (this._localDebug || this._testRunner) {
      // For the local debugging of the UI, which does not seem to like loading json without a .json suffix
      const index = path.indexOf('?');
      if (index > 0) {
        path = path.substr(0, index);
      }
      return path + '.json';
    }
    return this._overbaardPrefix + path;
  }

  private calculateJiraUrl(): string {
    if (this._localDebug) {
      // Return the locally running Jira instance since this is still where the icons etc are loaded from
      return 'http://localhost:2990/jira';
    }
    if (!this._testRunner) {
      console.error('Could not determine jira url ' + location.href);
    }
    return 'http://example.com/jira';
  }
}
