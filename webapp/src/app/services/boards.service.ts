import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/observable/throw';
import {RestUrlService} from './rest-url.service';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';

const OVERBAARD_REST_PREFIX = 'rest/overbaard/1.0';

@Injectable()
export class BoardsService {
  private timeout = 30000;

  constructor(private _restUrlService: RestUrlService, private _httpClient: HttpClient) {
  }

  loadBoardsList(summaryOnly: boolean): Observable<any[]> {
    const path: string = this._restUrlService.caclulateRestUrl(
      summaryOnly ? OVERBAARD_REST_PREFIX + '/boards' : OVERBAARD_REST_PREFIX + '/boards?full=true');
    const ret: Observable<any> =
      this._httpClient.get(path)
        .timeout(this.timeout)
        .map(r => r['configs'])
        .catch(response => {
          if (response instanceof HttpErrorResponse) {
          }
          // TODO log error
          return Observable.throw(response);
        });

    return ret;
  }
/*
  loadBoardConfigJson(boardId: number): Observable<Response> {
    const path: string = this._restUrlService.caclulateRestUrl(OVERBAARD_REST_PREFIX + '/boards/' + boardId);
    console.log('Loading board configuration' + path);
    const ret: Observable<any> =
      this._httpClient.get(path)
        .timeout(this.timeout);

    return ret;
  }

  createBoard(json: string): Observable<Response> {
    const path: string = this._restUrlService.caclulateRestUrl(OVERBAARD_REST_PREFIX + '/boards');
    console.log('Saving board ' + path);
    const ret: Observable<any> =
      this._httpClient.post(path, json, {
        headers : this.createHeaders()
      })
        .timeout(this.timeout);
    return ret;
  }

  saveBoard(id: number, json: string): Observable<Response> {
    const path: string = this._restUrlService.caclulateRestUrl(OVERBAARD_REST_PREFIX + '/boards/' + id);
    console.log('Saving board ' + path);
    const ret: Observable<any> =
      this._httpClient.put(path, json, {
        headers : this.createHeaders()
      })
        .timeout(this.timeout);
    return ret;
  }

  deleteBoard(id: number): Observable<Response> {
    const path: string = this._restUrlService.caclulateRestUrl(OVERBAARD_REST_PREFIX + '/boards/' + id);
    console.log('Deleting board ' + path);
    const ret: Observable<any> =
      this._httpClient.delete(path, {
        headers : this.createHeaders()
      })
        .timeout(this.timeout);
    return ret;
  }

  saveRankCustomFieldId(id: number): Observable<Response> {
    const path: string = this._restUrlService.caclulateRestUrl(OVERBAARD_REST_PREFIX + 'rankCustomFieldId');
    console.log('Saving custom field id ' + path);
    const payload: string = JSON.stringify({id: id});
    const ret: Observable<any> =
      this._httpClient.put(path, payload, {
        headers : this.createHeaders()
      })
        .timeout(this.timeout);
    return ret;
  }*/

  private createHeaders(): HttpHeaders {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    return headers;
  }
}
