import {Action} from '@ngrx/store';
import {BlacklistState, BlacklistUtil, initialBlacklistState} from './blacklist.model';


const DESERIALIZE_BLACKLIST = 'DESERIALIZE_BLACKLIST';

class DeserializeBlacklistAction implements Action {
  readonly type = DESERIALIZE_BLACKLIST;

  constructor(readonly payload: BlacklistState) {
  }
}

export class BlacklistActions {
  static createDeserializeBlacklist(input: any): Action {
    return new DeserializeBlacklistAction(BlacklistUtil.fromJs(input ? input : {}));
  }
}

export function blacklistReducer(state: BlacklistState = initialBlacklistState, action: Action): BlacklistState {

  switch (action.type) {
    case DESERIALIZE_BLACKLIST: {
      const payload: BlacklistState = (<DeserializeBlacklistAction>action).payload;
      if ((BlacklistUtil.toStateRecord(payload)).equals(BlacklistUtil.toStateRecord(state))) {
        return state;
      }
      return payload;
    }
    default:
      return state;
  }
};

