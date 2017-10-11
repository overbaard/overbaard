import {BoardFilterState, initialBoardFilterState} from './board-filter/board-filter.model';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface UserSettingState {
  swimlane: string;
  filters: BoardFilterState;
}

const DEFAULT_STATE: UserSettingState = {
  swimlane: undefined,
  filters: initialBoardFilterState
}

interface UserSettingStateRecord extends TypedRecord<UserSettingStateRecord>, UserSettingState {
}

const STATE_FACTORY = makeTypedFactory<UserSettingState, UserSettingStateRecord>(DEFAULT_STATE);
export const initialUserSettingState: UserSettingState = STATE_FACTORY(DEFAULT_STATE);

export class UserSettingUtil {

  static toStateRecord(s: UserSettingState): UserSettingStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <UserSettingStateRecord>s;
  }

  static fromObject(object: UserSettingState) {
    return STATE_FACTORY(object);
  }
}
