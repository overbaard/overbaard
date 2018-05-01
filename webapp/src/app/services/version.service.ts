import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {UrlService} from './url.service';
import {Progress, ProgressLogService} from './progress-log.service';
import {Observable} from 'rxjs/Observable';
import {catchError, map, tap, timeout} from 'rxjs/operators';
import {_throw} from 'rxjs/observable/throw';


@Injectable()
export class VersionService {

    private _timeout = 20000;


    constructor(private _http: HttpClient, private _restUrlService: UrlService, private _progressError: ProgressLogService) {
    }


    getVersion(): Observable<string> {
      const path: string = this._restUrlService.caclulateRestUrl('rest/overbaard/1.0/version');
      const progress: Progress = this._progressError.startUserAction();
      return this._http.get(path)
        .pipe(
          timeout(this._timeout),
          map(d => d['overbaard-version']),
          tap(d => progress.complete()),
          catchError((response: HttpErrorResponse) => {
            progress.errorResponse(response);
            return _throw(response);
          })
        );
    }
}
