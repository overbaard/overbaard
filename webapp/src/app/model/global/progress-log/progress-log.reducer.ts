import {AppState} from '../../../app-store';
import {initialProgressLogState, ProgressLogUtil} from './progress-log.model';
import {Action, createSelector} from '@ngrx/store';
import {ProgressLogState} from './progress-log';
import {LogEntry} from './log-entry';

const START_LOADING = 'START_LOADING';
const COMPLETE_LOADING = 'COMPLETE_LOADING';
const LOG_MESSAGE = 'LOG_MESSAGE';
const CLEAR_FIRST_MESSAGE = 'CLEAR_FIRST_MESSAGE';
const NOT_LOGGED_IN = 'NOT_LOGGED_IN';
const EXTERNALLY_DISMISS_FIRST_MESSAGE = 'EXTERNALLY_DISMISS_FIRST_MESSAGE';
const RESET_EXTERNALLY_DISMISS_FIRST_MESSAGE = 'RESET_EXTERNALLY_DISMISS_FIRST_MESSAGE';

export class StartLoadingAction implements Action {
  type = START_LOADING;
}

export class CompleteLoadingAction implements Action {
  type = COMPLETE_LOADING;
}

export class LogMessageAction implements Action {
  type = LOG_MESSAGE;
  constructor(public payload: LogEntry) {
  }
}

export class ClearFirstMessageAction implements Action {
  type = CLEAR_FIRST_MESSAGE;
}

export class NotLoggedInAction implements Action {
  type = NOT_LOGGED_IN;
}

export class ExternallyDismissFirstMessageAction implements Action {
  type = EXTERNALLY_DISMISS_FIRST_MESSAGE;
}

export class ResetExternallyDismissFirstMessageAction implements Action {
  type = RESET_EXTERNALLY_DISMISS_FIRST_MESSAGE;
}

export class ProgressLogActions {

  static createStartLoading(): Action {
    return new StartLoadingAction();
  }

  static createCompletedLoading(): Action {
    return new CompleteLoadingAction();
  }

  static createLogMessage(message: string, error: boolean) {
    return new LogMessageAction({message: message, error: error});
  }

  static createClearFirstMessage() {
    return new ClearFirstMessageAction();
  }

  static createExternallyDismissFirstMessage() {
    return new ExternallyDismissFirstMessageAction();
  }

  static createResetExternallyFirstMessage() {
    return new ResetExternallyDismissFirstMessageAction();
  }

  static createNotLoggedIn() {
    return new NotLoggedInAction();
  }
}

export function progressLogReducer(state: ProgressLogState = initialProgressLogState, action: Action): ProgressLogState {

  switch (action.type) {
    case START_LOADING: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => mutable.loading++);
    }
    case COMPLETE_LOADING: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        if (mutable.loading > 0) {
          mutable.loading--;
        }
      });
    }
    case LOG_MESSAGE: {
      const logEntry: LogEntry = (<LogMessageAction>action).payload;
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        mutable.messages = mutable.messages.push(logEntry);
      });
    }
    case CLEAR_FIRST_MESSAGE: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        mutable.messages = mutable.messages.remove(0);
      });
    }
    case NOT_LOGGED_IN: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        mutable.notLoggedIn = true;
      });
    }
    case EXTERNALLY_DISMISS_FIRST_MESSAGE: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        mutable.externallyDismissFirstMessage = true;
      });
    }
    case RESET_EXTERNALLY_DISMISS_FIRST_MESSAGE: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => {
        mutable.externallyDismissFirstMessage = false;
      });
    }
  }
  return state;
}

export const progressLogSelector = (state: AppState) => state.progressLog;
const getLoading = (state: ProgressLogState) => state.loading > 0;
const getCurrentMessage = (state: ProgressLogState) => {
  return state.messages.size > 0 ? state.messages.get(0) : null;
}
const getNotLoggedIn = (state: ProgressLogState) => state.notLoggedIn;
const getExternallyDismissFirstMessage = (state: ProgressLogState) => state.externallyDismissFirstMessage;
export const progressLogLoadingSelector = createSelector(progressLogSelector, getLoading);
export const progressLogCurrentMessageSelector = createSelector(progressLogSelector, getCurrentMessage);
export const notLoggedInSelector = createSelector(progressLogSelector, getNotLoggedIn);
export const externallyDismissFirstMessageSelector = createSelector(progressLogSelector, getExternallyDismissFirstMessage);

