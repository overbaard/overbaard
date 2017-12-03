import {AppState} from '../../../app-store';
import {initialProgressLogState, ProgressLogUtil} from './progress-log.model';
import {Action, createSelector} from '@ngrx/store';
import {ProgressLogState} from './progress-log';

const START_LOADING = 'START_LOADING';
const COMPLETE_LOADING = 'COMPLETE_LOADING';


export class StartLoadingAction implements Action {
  type = START_LOADING;
}

export class CompleteLoadingAction implements Action {
  type = COMPLETE_LOADING;
}

export class ProgressLogActions {

  static createStartLoading(): Action {
    return new StartLoadingAction();
  }

  static createCompletedLoading(): Action {
    return new CompleteLoadingAction();
  }
}

export function progressLogReducer(state: ProgressLogState = initialProgressLogState, action: Action): ProgressLogState {

  switch (action.type) {
    case START_LOADING: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => mutable.loading = true);
    }
    case COMPLETE_LOADING: {
      return ProgressLogUtil.updateProgressLogState(state, mutable => mutable.loading = false);
    }
  }
  return state;
}

export const progressLogSelector = (state: AppState) => state.progressLog;
const getLoading = (state: ProgressLogState) => state.loading;
export const progressLogLoadingSelector = createSelector(progressLogSelector, getLoading);
