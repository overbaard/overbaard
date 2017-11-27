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
      const newState = HeaderUtil.withMutatons(state, mutable => {
        mutable.categories = List<string>(payload.headers);
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

        mutable.states = states.asImmutable();
        mutable.wip = wip.asImmutable();
        mutable.stateToCategoryMappings = stateToCategoryMappings.asImmutable();
      });
      if (HeaderUtil.toStateRecord(newState).equals(HeaderUtil.toStateRecord(state))) {
        return state;
      }
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

