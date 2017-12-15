import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app-store';
import {ProgressLogActions} from '../model/global/progress-log/progress-log.reducer';

@Injectable()
export class ProgressLogService {

  constructor(private _store: Store<AppState>) {
  }

  startLoading(message?: string): Progress {
    this._store.dispatch(ProgressLogActions.createStartLoading());
    return new Progress(this, this._store, message);
  }


  logMessage(message: string, error: boolean) {
    this._store.dispatch(ProgressLogActions.createLogMessage(message, error));
  }
}

export class Progress {
  constructor(private service: ProgressLogService, private _store: Store<AppState>, private message?: string) {
  }

  complete() {
    this._store.dispatch(ProgressLogActions.createCompletedLoading());
    if (this.message) {
      this.service.logMessage(this.message, false);
    }
  }

  error(message: string) {
    this._store.dispatch(ProgressLogActions.createCompletedLoading());
    // TODO parse the error here. Perhaps change the parameter to use the return of the http error stuff
    this.service.logMessage(message, true);
  }
}
