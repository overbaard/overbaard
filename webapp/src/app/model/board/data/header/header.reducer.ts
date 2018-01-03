import {List} from 'immutable';
import {HeaderUtil, initialHeaderState} from './header.model';
import {Action} from '@ngrx/store';
import {HeaderState} from './header.state';


const DESERIALIZE_HEADERS = 'DESERIALIZE_HEADERS';

class DeserializeHeadersAction implements Action {
  readonly type = DESERIALIZE_HEADERS;
  constructor(readonly payload: DeserializeHeadersPayload) {
  }
}

export class HeaderActions {
  static createDeserializeHeaders(states: any[], headers: string[], backlog: number, done: number): Action {
    return new DeserializeHeadersAction({states: states, headers: headers, backlog: backlog, done: done});
  }
}

export function headerMetaReducer(state: HeaderState = initialHeaderState, action: Action): HeaderState {
  switch (action.type) {
    case DESERIALIZE_HEADERS: {
      const payload: DeserializeHeadersPayload = (<DeserializeHeadersAction>action).payload;
      const newState = HeaderUtil.withMutations(state, mutable => {
        const categories: List<string> = List<string>(payload.headers);
        if (!mutable.categories.equals(categories)) {
          mutable.categories = categories;
        }
        mutable.backlog = payload.backlog;

        const sizeNotIncludingDone = payload.states.length - payload.done;
        const states: List<string> = List<string>().setSize(sizeNotIncludingDone).asMutable();
        const wip: List<number> = List<number>().setSize(sizeNotIncludingDone - payload.backlog).asMutable();
        const stateToCategoryMappings: List<number> = List<number>().setSize(sizeNotIncludingDone - payload.backlog).asMutable();

        payload.states.forEach((stateInput, i) => {
          if (i >= sizeNotIncludingDone) {
            return false;
          }
          states.set(i, stateInput['name']);
          if (i >= payload.backlog) {
            wip.set(i - payload.backlog, stateInput['wip'] ? stateInput['wip'] : 0);
            stateToCategoryMappings.set(i - payload.backlog, isNaN(stateInput['header']) ? -1 : stateInput['header']);
          }
        });

        if (!mutable.states.equals(states)) {
          mutable.states = states.asImmutable();
        }
        if (!mutable.wip.equals(wip)) {
          mutable.wip = wip.asImmutable();
        }
        if (!mutable.stateToCategoryMappings.equals(stateToCategoryMappings)) {
          mutable.stateToCategoryMappings = stateToCategoryMappings.asImmutable();
        }
      });
      return newState;
    }
  }
  return state;
}

interface DeserializeHeadersPayload {
  states: any[];
  headers: string[];
  backlog: number;
  done: number;
}

