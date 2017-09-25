import {Injectable} from '@angular/core';

@Injectable()
export class RestUrlService {
  private _overbaardPrefix: string;
  private _localDebug: boolean;
  private _testRunner: boolean;
  private _jiraUrl: string;

  constructor() {
    const location: Location = window.location;

    let index: number = location.href.indexOf('/overbaard/');
    this._overbaardPrefix = index >= 0 ? location.href.substr(0, index) + '/' : null;
    this._localDebug = location.hostname === 'localhost' && location.port === '4200';
    // In our current test setup the url http://localhost:9876/context.html is used by the runner
    this._testRunner = location.hostname === 'localhost' && location.port === '9876';
    if (this._overbaardPrefix) {
      index = this._overbaardPrefix.indexOf('/overbaard/');
      this._jiraUrl = this._overbaardPrefix.substr(0, index);
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
