import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import 'rxjs/add/operator/catch';
import {RestUrlService} from './rest-url.service';
import {ProgressLogService} from './progress-log.service';
import {Observable} from 'rxjs/Observable';


@Injectable()
export class VersionService {

    private _timeout = 20000;


    constructor(private _http: HttpClient, private _restUrlService: RestUrlService, private _progressError: ProgressLogService) {
    }


    getVersion(): Observable<string> {
      const path: string = this._restUrlService.caclulateRestUrl('rest/overbaard/1.0/version');
      return this._http.get(path)
        .timeout(this._timeout)
        .map(d => d['overbaard-version'])
        .catch((response: HttpErrorResponse) => {
          // TODO log error properly
          console.log(response);
          if (response instanceof HttpErrorResponse) {
          }
          return Observable.throw(response);
        });
    }
}
