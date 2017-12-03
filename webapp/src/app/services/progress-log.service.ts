import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app-store';
import {ProgressLogActions} from '../model/global/progress-log/progress-log.reducer';

@Injectable()
export class ProgressLogService {

  private _counter = 0;

  constructor(private _store: Store<AppState>) {
  }

  startLoading(): Progress {
    this._store.dispatch(ProgressLogActions.createStartLoading());
    return new Progress(this, this._store);
  }

  logMessage(message: string, error: boolean) {

  }
}

export class Progress {
  constructor(private service: ProgressLogService, private _store: Store<AppState>) {
  }

  complete(message?: string) {
    this._store.dispatch(ProgressLogActions.createCompletedLoading());
    if (message) {
      this.service.logMessage(message, false);
    }
  }

  error(message: string) {
    this._store.dispatch(ProgressLogActions.createCompletedLoading());
    // TODO parse the error here. Perhaps change the parameter to use the return of the http error stuff
    this.service.logMessage(message, true);
  }
}
