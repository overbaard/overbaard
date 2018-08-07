import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app-store';
import {ProgressLogActions} from '../model/global/progress-log/progress-log.reducer';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable()
export class ProgressLogService {
  private readonly _delegate: ProgressDelegate;

  constructor(private _store: Store<AppState>) {
    this._delegate = new ProgressDelegate(_store);
  }

  resetForNewRoute() {
    this._delegate.resetForNewRoute();
  }

  startAction(showProgress: boolean, message?: string): Progress {
    return this._delegate.createProgress(showProgress, message);
  }

  startUserAction(message?: string): Progress {
    return this.startAction(true, message);
  }

  startBackgroundAction(message?: string): Progress {
    return this.startAction(false, message);
  }
}

export class Progress {

  constructor(
    private readonly _delegate: ProgressDelegate,

    // Incremented by the delegate each time we enter a new route
    private readonly _routeId: number,

    public _showProgress: boolean,
    private message?: string) {

    if (this._showProgress) {
      this._delegate.startLoading(this._routeId);
    }
  }

  complete() {
    this.finishProgress();
    if (this.message) {
      this._delegate.logMessage(this._routeId, this.message, false);
    }
  }

  errorResponse(response: HttpErrorResponse) {
    this.finishProgress();

    let status: number;
    if (response instanceof HttpErrorResponse) {
      status = response.status;
    }

    if (status === 401) {
      this._delegate.notLoggedIn();
    } else {
      let message: string = response.message;
      if (status === 400 && response.error && response.error.message) {
        message = response.error.message;
      }
      this._delegate.logMessage(this._routeId, message, true);
    }
  }

  logError(message: string) {
    this.finishProgress();
    this._delegate.logMessage(this._routeId, message, true);

  }

  logWarning(message: string) {
    this.finishProgress();
    this._delegate.logMessage(this._routeId, message, false);

  }

  private finishProgress() {
    if (this._showProgress) {
      this._delegate.finishProgress(this._routeId);
    }
  }
}

class ProgressDelegate {

  // Incremented each time we enter a new route
  private _currentRouteId = 0;


  constructor(private readonly _store: Store<AppState>) {
  }


  resetForNewRoute() {
    this._currentRouteId++;
    this._store.dispatch(ProgressLogActions.createResetForNewRoute());
  }

  createProgress(showProgress: boolean, message?: string): Progress {
    return new Progress(this, this._currentRouteId, showProgress, message);
  }

  startLoading(routeId: number) {
    if (this._currentRouteId === routeId) {
      this._store.dispatch(ProgressLogActions.createStartLoading());
    }
  }

  finishProgress(routeId: number) {
    if (this._currentRouteId === routeId) {
      this._store.dispatch(ProgressLogActions.createCompletedLoading());
    }
  }

  notLoggedIn() {
    this._store.dispatch(ProgressLogActions.createNotLoggedIn());
  }

  logMessage(routeId: number, message: string, error: boolean) {
    if (this._currentRouteId === routeId) {
      this._store.dispatch(ProgressLogActions.createLogMessage(message, error));
    }
  }
}
