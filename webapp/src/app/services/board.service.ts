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
import {BoardIssueView} from '../view-model/board/board-issue-view';

@Injectable()
export class BoardService {
  static readonly _bigTimeout: number = 60000;
  static readonly _smallTimeout: number = 20000;

  private _changePoller: ChangePoller;

  constructor(private readonly _restUrlService: UrlService,
              private readonly _http: HttpClient,
              private readonly _progressLog: ProgressLogService,
              private readonly _store: Store<AppState>) {
  }


  loadBoardData(boardCode: string, backlog: boolean) {
    // Cancel any background polling
    this.stopPolling();

    const progress: Progress = this._progressLog.startUserAction();
    let url = UrlService.OVERBAARD_REST_PREFIX + '/issues/' + boardCode;
    if (backlog) {
      url += '?backlog=' + true;
    }
    const path: string = this._restUrlService.caclulateRestUrl(url);
    return executeRequest(
      progress,
      BoardService._bigTimeout,
      () => {},
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
    // Cancel any background polling
    this.stopPolling();

    const progress: Progress = this._progressLog.startUserAction();

    const path: string = this._restUrlService.caclulateRestUrl(
      UrlService.OVERBAARD_REST_PREFIX + '/issues/' + boardCode + '/parallel/' + issueKey);
    console.log('Updating parallel task ' + path);
    const payload = {
      'task-index': taskIndex,
      'option-index': selectedOptionIndex
    }

    executeRequest(
      progress,
      BoardService._bigTimeout,
      () => this.recreateChangePollerAndStartPolling(boardCode, backlog, true, 0),
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

  saveIssueComment(boardCode: string, backlog: boolean, issue: BoardIssueView, comment: string, success: () => void) {
    // Cancel any background polling
    this.stopPolling();

    const progress: Progress = this._progressLog.startUserAction(`Commented on issue ${issue.key}`);

    const path: string = this._restUrlService.jiraUrl + 'rest/api/2/issue/' + issue.key + '/comment';

    const payload: any = {body: comment};

    executeRequest(
      progress,
      BoardService._bigTimeout,
      () => this.recreateChangePollerAndStartPolling(boardCode, backlog, true, 0),
      this._http.post(path, JSON.stringify(payload), {
        headers : this.createHeaders()
      }))
      .take(1)
      .subscribe(
        data => {
          success();
          this.recreateChangePollerAndStartPolling(boardCode, backlog, true, 0);
        }
      );
  }

  rankIssue(rankCustomFieldId: number, boardCode: string, issue: BoardIssueView, beforeKey: string, afterKey: string, success: () => void) {
    // Cancel any background polling
    this.stopPolling();

    let msg = `Ranked issue ${issue.key} `;
    if (beforeKey) {
      msg += `before ${beforeKey}`;
    } else {
      msg += 'to the end';
    }
    const progress: Progress = this._progressLog.startUserAction(msg);
    const path: string = this._restUrlService.jiraUrl + 'rest/greenhopper/1.0/rank';
    console.log('Ranking issue ' + path);

    const payload: any = {
      customFieldId: rankCustomFieldId,
      issueKeys: [issue.key],
    };
    if (beforeKey) {
      payload.rankBeforeKey = beforeKey;
    }
    if (afterKey) {
      payload.rankAfterKey = afterKey;
    }
    // console.log(JSON.stringify(payload));

    executeRequest(
      progress,
      BoardService._bigTimeout,
      () => this.recreateChangePollerAndStartPolling(boardCode, true, true, 0),
      this._http.put(path, JSON.stringify(payload), {
        headers : this.createHeaders()
      }))
      .take(1)
      .subscribe(
        data => {
          success();
          this.recreateChangePollerAndStartPolling(boardCode, true, true, 0);
        }
      );
  }

  moveIssue(boardCode: string, showBacklog: boolean, issue: BoardIssueView, boardState: string, ownState: string, success: () => void) {
    // Cancel any background polling
    this.stopPolling();

    const progress: Progress = this._progressLog.startUserAction(`Moved ${issue.key} to the ${boardState} column`);

    // First get the transitions
    const path = this._restUrlService.jiraUrl + 'rest/api/2/issue/' + issue.key + '/transitions';
    console.log('Getting transitions for issue ' + path);
    // Don't use executeRequest here to keep the progress open until we actually do the transition
    this._http.get(path)
      .timeout(BoardService._smallTimeout)
      .catch((err: HttpErrorResponse) => {
        progress.errorResponse(err);
        this.recreateChangePollerAndStartPolling(boardCode, showBacklog, true, 0);
        return Observable.throw(err);
      })
      .take(1)
      .subscribe(data => {
        this.getTransitionsAndPerformMove(boardCode, showBacklog, progress, issue, boardState, ownState, success, data);
      });
  }

  private getTransitionsAndPerformMove(
    boardCode: string, showBacklog: boolean, progress: Progress, issue: BoardIssueView, boardState: string,
    ownState: string, success: () => void, transitionsValue: any) {

    let transitionId = -1;
    const transitions: any[] = transitionsValue['transitions'];
    for (const transition of transitions) {
      if (transition['to']) {
        if (transition['to']['name'] === ownState) {
          transitionId = transition.id;
          break;
        }
      }
    }

    if (transitionId === -1) {
      let state: string = boardState;
      if (ownState !== boardState) {
        state = state + '(' + ownState + ')';
      }
      progress.logError('Could not find a valid transition to ' + state);
      return;
    }

    const path = this._restUrlService.jiraUrl + 'rest/api/2/issue/' + issue.key + '/transitions';
    const payload: any = {transition: {id: transitionId}};
    console.log('Moving issue ' + path);

    executeRequest(
      progress,
      BoardService._bigTimeout,
      () => this.recreateChangePollerAndStartPolling(boardCode, showBacklog, true, 0),
      this._http.post(path, JSON.stringify(payload), {
        headers : this.createHeaders()
      }))
      .take(1)
      .subscribe(
        data => {
          success();
          this.recreateChangePollerAndStartPolling(boardCode, showBacklog, true, 0);
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

  private stopPolling() {
    if (this._changePoller) {
      this._changePoller.destroy();
      this._changePoller = null;
    }
  }

  private recreateChangePollerAndStartPolling(boardCode: string, backlog: boolean, progressOnFirst: boolean, initialWait?: number) {
    if (this._changePoller) {
      this._changePoller.destroy();
      this._changePoller = name;
    }
    this._changePoller =
      new ChangePoller(boardCode, backlog, this._store, this._restUrlService, this._http, this._progressLog, progressOnFirst);
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
    private _progressLog: ProgressLogService,
    private readonly _showProgress: boolean) {

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
      poller = new ChangePoller(this._boardCode, this._backlog, this._store, this._restUrlService, this._http, this._progressLog, false);
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

      const progress: Progress = this._progressLog.startAction(this._showProgress);
      const path: string = this._restUrlService.caclulateRestUrl(url);
      // Don't use execute request since we want to handle the errors differently
      this._currentPollTimerSubscription = this._http.get(path)
        .timeout(BoardService._bigTimeout)
        .take(1)
        .subscribe(
          data => {
            progress.complete();
            if (!this._destroyed) {
              this._errorCount = 0;
              if (!this._destroyed) {
                this._store.dispatch(BoardActions.createChanges(data));
                this.pollBoard();
              }
            }
          },
          error => {
            let handledProgress = false;
            if (!this._destroyed) {
              this._errorCount++;
              if (this._errorCount >= ChangePoller._maxErrorCount) {
                progress.logError(`Error count is ${this._errorCount}. Giving up polling.`);
                handledProgress = true;
                this.destroy();
              }
              this.pollBoard();
            }
            if (!handledProgress) {
              progress.complete();
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

function executeRequest<T>(progress: Progress, timeout: number, errorCallback: () => void, observable: Observable<T>): Observable<T> {
  let ret: Observable<T> = observable
    .timeout(timeout);

  ret = ret.do(d => progress.complete())

  return ret.catch((err: HttpErrorResponse) => {
    if (errorCallback) {
      errorCallback();
    }
    progress.errorResponse(err);
    return Observable.throw(err);
  });
}
