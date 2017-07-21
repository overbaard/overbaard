import {Assignee} from './common/assignee/assignee.model';
import * as assignee from './common/assignee/assignee.service';
import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';

export interface State {
  assignees: Assignee[];
}

const reducers = {
  assignees: assignee.reducer,
};


// TODO - add some tools
// const developmentReducer: ActionReducer<State> = compose(combineReducers)(reducers);
const productionReducer: ActionReducer<State> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  // TODO
  /*if (environment.production) {
    return productionReducer(state, action);
  } else {
    return developmentReducer(state, action);
  }*/
  return productionReducer(state, action);
}


