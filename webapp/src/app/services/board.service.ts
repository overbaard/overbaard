import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {UrlService} from './url.service';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/timer';
import {Progress, ProgressLogService} from './progress-log.service';
import {Subscription} from 'rxjs/Subscription';
import {Store} from '@ngrx/store';
import {AppState} from '../app-store';
import {BoardActions, boardViewIdSelector} from '../model/board/data/board.reducer';
import {showBacklogSelector} from '../model/board/user/user-setting.reducer';

@Injectable()
export class BoardService {
  static readonly _bigTimeout: number = 60000;

  private _changePoller: ChangePoller;

  constructor(private readonly _restUrlService: UrlService,
              private readonly _http: HttpClient,
              private readonly _progressLog: ProgressLogService,
              private readonly _store: Store<AppState>) {
  }


  loadBoardData(boardCode: string, backlog: boolean) {
    // Cancel any background polling
    if (this._changePoller) {
      this._changePoller.destroy();
      this._changePoller = null;
    }

    const progress: Progress = this._progressLog.startLoading();
    let url = UrlService.OVERBAARD_REST_PREFIX + '/issues/' + boardCode;
    if (backlog) {
      url += '?backlog=' + true;
    }
    const path: string = this._restUrlService.caclulateRestUrl(url);
    return executeRequest(
      progress,
      BoardService._bigTimeout,
      this._http.get(path))
      .take(1)
      .subscribe(
        data => {
          this._store.dispatch(BoardActions.createDeserializeBoard(this._restUrlService.jiraUrl, data));
          this.recreateChangePollerAndStartPolling(boardCode, backlog, false);
        }
      );
  }

  setParallelTaskOption(boardCode: string, backlog: boolean, issueKey: string, taskIndex: number, selectedOptionIndex: number) {
    // Cancel any background polling
    if (this._changePoller) {
      this._changePoller.destroy();
      this._changePoller = null;
    }

    const progress: Progress = this._progressLog.startLoading();

    const path: string = this._restUrlService.caclulateRestUrl(
      UrlService.OVERBAARD_REST_PREFIX + '/issues/' + boardCode + '/parallel/' + issueKey);
    console.log('Updating parallel task ' + path);
    const payload = {
      'task-index': taskIndex,
      'option-index': selectedOptionIndex
    }

    return executeRequest(
      progress,
      BoardService._bigTimeout,
      this._http.put(path, JSON.stringify(payload), {
        headers : this.createHeaders()
      }))
      .take(1)
      .subscribe(
        data => {
          this.recreateChangePollerAndStartPolling(boardCode, backlog, true, 0);
        }
      );
  }

  set visible(visible: boolean) {
    if (this._changePoller) {
      this._changePoller = this._changePoller.setVisible(visible);
    }
  }

  destroy() {
    if (this._changePoller) {
      this._changePoller.destroy();
    }
  }

  recreateChangePollerAndStartPolling(boardCode: string, backlog: boolean, progressOnFirst: boolean, initialWait?: number) {
    if (this._changePoller) {
      this._changePoller.destroy();
      this._changePoller = name;
    }
    this._changePoller =
      new ChangePoller(boardCode, backlog, this._store, this._restUrlService, this._http,
        progressOnFirst ? this._progressLog : null);
    this._changePoller.startPolling(initialWait);
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .append('Content-Type', 'application/json');
  }
}

class ChangePoller {
  static readonly _pollTime: number = 15000;
  static readonly _maxErrorCount: number = 3;
  private _destroyed = false;
  private _visible = true;
  private _wasInvisibleDuringPoll = false;
  private _errorCount = 0;

  private _currentPollTimerSubscription: Subscription;
  private _currentPollRequestSubscription: Subscription;

  private readonly _pollParameters$: Observable<PollParameters>;

  constructor(
    private readonly _boardCode: string,
    private readonly _backlog: boolean,
    private readonly _store: Store<AppState>,
    private readonly _restUrlService: UrlService,
    private readonly _http: HttpClient,
    private _progressLog: ProgressLogService) {

    this._pollParameters$ = Observable.combineLatest(
      this._store.select(boardViewIdSelector),
      this._store.select(showBacklogSelector),
      (viewId: number, showBacklog: boolean): PollParameters => {
        return {boardCode: _boardCode, viewId: viewId, showBacklog: showBacklog};
      });
  }

  // This will either return 'this' or a new instance depending on the state of the poller
  setVisible(visible: boolean): ChangePoller {
    let poller: ChangePoller = this;
    const restartPolling: boolean = visible && !this._visible && this._wasInvisibleDuringPoll;
    if (restartPolling) {
      this.destroy();
      poller = new ChangePoller(this._boardCode, this._backlog, this._store, this._restUrlService, this._http, this._progressLog);
      poller.startPolling(0);
    } else {
      poller._visible = visible;
    }
    return poller;
  }

  startPolling(initialWait?: number) {
    if (this._errorCount < ChangePoller._maxErrorCount) {
      this._errorCount = 0;
      this.pollBoard(initialWait);
    }
  }

  destroy() {
    this._destroyed = true;
    const pollSubscription: Subscription = this._currentPollTimerSubscription;
    if (pollSubscription) {
      pollSubscription.unsubscribe();
      this._currentPollTimerSubscription = null;
    }
    const requestSubscription: Subscription = this._currentPollRequestSubscription;
    if (requestSubscription) {
      requestSubscription.unsubscribe();
      this._currentPollRequestSubscription = null;
    }
  }

  pollBoard(initialWait: number = ChangePoller._pollTime) {
    if (!this._destroyed) {
      this._pollParameters$.take(1).subscribe(
        params => {
          if (!this._destroyed) {
            this._currentPollTimerSubscription = Observable.timer(initialWait)
              .subscribe(
                success => {
                  if (!this._destroyed) {
                    if (this._visible) {
                      this._wasInvisibleDuringPoll = false;
                      this.doPoll(params);
                    } else {
                      this._wasInvisibleDuringPoll = true;
                    }
                  }
                });
          }
        });
    }
  }

  private doPoll(params: PollParameters) {
    if (!this._destroyed) {
      let url: string = UrlService.OVERBAARD_REST_PREFIX + '/issues/' + params.boardCode + '/updates/' + params.viewId;
      if (params.showBacklog) {
        url += '?backlog=' + true;
      }
      let progress: Progress;
      if (this._progressLog) {
        progress = this._progressLog.startLoading();
        // Only want the first progress in some cases
        this._progressLog = null;
      }
      const path: string = this._restUrlService.caclulateRestUrl(url);
      this._currentPollTimerSubscription = executeRequest(null, BoardService._bigTimeout, this._http.get(path))
        .take(1)
        .subscribe(
          data => {
            if (progress) {
              progress.complete();
            }
            if (!this._destroyed) {
              this._errorCount = 0;
              if (!this._destroyed) {
                this._store.dispatch(BoardActions.createChanges(data));
                this.pollBoard();
              }
            }
          },
          error => {
            if (!this._destroyed) {
              console.log('Error polling');
              this._errorCount++;
              if (this._errorCount >= ChangePoller._maxErrorCount) {
                if (progress) {
                  // TODO show error
                }
                console.log(`Error count is ${this._errorCount}. Giving up polling.`)
                this.destroy();
              }
              this.pollBoard();
            }
          }
        );
    }
  }
}

interface PollParameters {
  boardCode: string;
  viewId: number;
  showBacklog: boolean;
}

function executeRequest<T>(progress: Progress, timeout: number, observable: Observable<T>): Observable<T> {
  let ret: Observable<T> = observable
    .timeout(timeout);
  if (progress) {
    ret = ret.do(d => progress.complete())
  }
  return ret.catch((response: HttpErrorResponse) => {
    // TODO log error properly
    console.log(response);
    if (response instanceof HttpErrorResponse) {
    }
    return Observable.throw(response);
  });
}
