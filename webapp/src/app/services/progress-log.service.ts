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
  constructor(private _delegate: ProgressDelegate, public _showProgress: boolean, private message?: string) {
    if (this._showProgress) {
      this._delegate.startLoading();
    }
  }

  complete() {
    this.finishProgress();
    if (this.message) {
      this._delegate.logMessage(this.message, false);
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
      this._delegate.logMessage(response.message, true);
    }
  }

  logError(message: string) {
    this.finishProgress();
    this._delegate.logMessage(message, true);

  }

  private finishProgress() {
    if (this._showProgress) {
      this._delegate.finishProgress();
    }
  }
}

class ProgressDelegate {
  constructor(private readonly _store: Store<AppState>) {
  }

  createProgress(showProgress: boolean, message?: string): Progress {
    return new Progress(this, showProgress, message);
  }

  startLoading() {
    this._store.dispatch(ProgressLogActions.createStartLoading());
  }

  finishProgress() {
    this._store.dispatch(ProgressLogActions.createCompletedLoading());
  }

  notLoggedIn() {
    this._store.dispatch(ProgressLogActions.createNotLoggedIn());
  }

  logMessage(message: string, error: boolean) {
    this._store.dispatch(ProgressLogActions.createLogMessage(message, error));
  }
}
