import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {RestUrlService} from './rest-url.service';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/observable/throw';

const OVERBAARD_REST_PREFIX = 'rest/overbaard/1.0';

@Injectable()
export class BoardService {
  private static readonly _bigTimeout: number = 60000;

  constructor(private _restUrlService: RestUrlService, private _http: HttpClient) {
  }

  loadBoardData(board: string, backlog: boolean): Observable<any> {
    let url = OVERBAARD_REST_PREFIX + '/issues/' + board;
    if (backlog) {
      url += '?backlog=' + true;
    }
    const path: string = this._restUrlService.caclulateRestUrl(url);
    return this._http.get(path)
      .timeout(BoardService._bigTimeout)
      .catch(response => {
        if (response instanceof HttpErrorResponse) {
        }
        // TODO log error
        return Observable.throw(response);
      });
  }


}
