import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import {RestUrlService} from './rest-url.service';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';

@Injectable()
export class BoardsService {
  private _timeout = 30000;

  constructor(private _restUrlService: RestUrlService, private _httpClient: HttpClient) {
  }

  loadBoardsList(summaryOnly: boolean): Observable<any[]> {
    const path: string = this._restUrlService.caclulateRestUrl(
      summaryOnly ? RestUrlService.OVERBAARD_REST_PREFIX + '/boards' : RestUrlService.OVERBAARD_REST_PREFIX + '/boards?full=true');
    return this._httpClient.get(path)
      .timeout(this._timeout)
      .map(r => summaryOnly ? r['configs'] : r)
      .catch(response => {
        // TODO log error properly
        console.log(response);
        if (response instanceof HttpErrorResponse) {
        }
        return Observable.throw(response);
      });
  }

  loadBoardConfigJson(boardId: number): Observable<any> {
    const path: string = this._restUrlService.caclulateRestUrl(RestUrlService.OVERBAARD_REST_PREFIX + '/boards/' + boardId);
    return this._httpClient.get(path)
      .timeout(this._timeout)
      .catch(response => {
        if (response instanceof HttpErrorResponse) {
        }
        // TODO log error
        return Observable.throw(response);
      });
  }

  createBoard(json: string): Observable<Object> {
    const path: string = this._restUrlService.caclulateRestUrl(RestUrlService.OVERBAARD_REST_PREFIX + '/boards');
    console.log('Saving new board ' + path);
    return this._httpClient
      .post(path, json, {
          headers : this.createHeaders()
        })
      .timeout(this._timeout)
      .catch(response => {
        // TODO log error properly
        console.log(response);
        if (response instanceof HttpErrorResponse) {
        }
        return Observable.throw(response);
      });
  }

  saveBoard(id: number, json: string): Observable<Object> {
    const path: string = this._restUrlService.caclulateRestUrl(RestUrlService.OVERBAARD_REST_PREFIX + '/boards/' + id);
    console.log('Saving board ' + path);
    return this._httpClient
      .put(path, json, {
        headers : this.createHeaders()
      })
      .timeout(this._timeout)
      .catch(response => {
        // TODO log error properly
        console.log(response);
        if (response instanceof HttpErrorResponse) {
        }
        return Observable.throw(response);
      });
  }

  deleteBoard(id: number): Observable<Object> {
    const path: string = this._restUrlService.caclulateRestUrl(RestUrlService.OVERBAARD_REST_PREFIX + '/boards/' + id);
    console.log('Deleting board ' + path);
    return this._httpClient
      .delete(path, {
        headers: this.createHeaders()
      })
      .timeout(this._timeout)
      .catch(response => {
        // TODO log error properly
        console.log(response);
        if (response instanceof HttpErrorResponse) {
        }
        return Observable.throw(response);
      });
  }

  saveRankCustomFieldId(id: number): Observable<Object> {
    const path: string = this._restUrlService.caclulateRestUrl(RestUrlService.OVERBAARD_REST_PREFIX + '/rankCustomFieldId');
    console.log('Saving custom field id ' + path);
    const payload: string = JSON.stringify({id: id});
    return this._httpClient
      .put(path, payload, {
        headers: this.createHeaders()
      })
      .timeout(this._timeout)
      .catch(response => {
        // TODO log error properly
        console.log(response);
        if (response instanceof HttpErrorResponse) {
        }
        return Observable.throw(response);
      });
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .append('Content-Type', 'application/json');
  }
}
