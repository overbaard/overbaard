import {Injectable} from '@angular/core';
import {Observable, throwError as _throw} from 'rxjs';
import {UrlService} from './url.service';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Progress, ProgressLogService} from './progress-log.service';
import {catchError, map, tap, timeout} from 'rxjs/operators';

@Injectable()
export class BoardsService {
  private _timeout = 30000;

  constructor(private _restUrlService: UrlService, private _httpClient: HttpClient, private _progressLog: ProgressLogService) {
  }

  loadBoardsList(summaryOnly: boolean): Observable<any[]> {
    const progress: Progress = this._progressLog.startUserAction();
    const path: string = this._restUrlService.caclulateRestUrl(
      summaryOnly ? UrlService.OVERBAARD_REST_PREFIX + '/boards' : UrlService.OVERBAARD_REST_PREFIX + '/boards?full=true');
    return this.executeRequest(progress, this._httpClient.get(path))
      .pipe(
        map(r => summaryOnly ? r['configs'] : r)
      );
  }

  loadBoardConfigJson(boardId: number): Observable<any> {
    const progress: Progress = this._progressLog.startUserAction();
    const path: string = this._restUrlService.caclulateRestUrl(UrlService.OVERBAARD_REST_PREFIX + '/boards/' + boardId);
    return this.executeRequest(progress, this._httpClient.get(path));
  }

  createBoard(json: string): Observable<Object> {
    const progress: Progress = this._progressLog.startUserAction();
    const path: string = this._restUrlService.caclulateRestUrl(UrlService.OVERBAARD_REST_PREFIX + '/boards');
    return this.executeRequest(
      progress,
      this._httpClient.post(path, json, {
        headers : this.createHeaders()
      }));
  }

  saveBoard(id: number, json: string): Observable<Object> {
    const progress: Progress = this._progressLog.startUserAction();
    const path: string = this._restUrlService.caclulateRestUrl(UrlService.OVERBAARD_REST_PREFIX + '/boards/' + id);
    return this.executeRequest(
      progress,
      this._httpClient
        .put(path, json, {
          headers : this.createHeaders()
        }));
  }

  deleteBoard(id: number): Observable<Object> {
    const progress: Progress = this._progressLog.startUserAction();

    const path: string = this._restUrlService.caclulateRestUrl(UrlService.OVERBAARD_REST_PREFIX + '/boards/' + id);
    console.log('Deleting board ' + path);
    return this.executeRequest(
      progress,
      this._httpClient
      .delete(path, {
        headers: this.createHeaders()
      }));
  }

  saveRankCustomFieldId(id: number): Observable<Object> {
    const progress: Progress = this._progressLog.startUserAction();

    const path: string = this._restUrlService.caclulateRestUrl(UrlService.OVERBAARD_REST_PREFIX + '/rankCustomFieldId');
    console.log('Saving custom field id ' + path);
    const payload: string = JSON.stringify({id: id});
    return this.executeRequest(
      progress,
      this._httpClient
        .put(path, payload, {
          headers: this.createHeaders()
        }));
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .append('Content-Type', 'application/json');
  }

  private executeRequest<T>(progress: Progress, observable: Observable<T>): Observable<T> {
    return observable
      .pipe(
        timeout(this._timeout),
        catchError((response: HttpErrorResponse) => {
          progress.errorResponse(response);
          return _throw(response);
        }),
        tap(s => {
          progress.complete();
        })
      );
  }
}
