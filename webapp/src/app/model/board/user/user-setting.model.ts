import {BoardFilterState, initialBoardFilterState} from './board-filter/board-filter.model';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Map} from 'immutable';

export interface UserSettingState {
  boardCode: string;
  showBacklog: boolean;
  swimlane: string;
  filters: BoardFilterState;
  /**
   * Only used on initialisation of the board
   */
  defaultColumnVisibility: boolean;
  /**
    Until the board data is got, this will only contain values for column visibilities explicitly set.
    A non-existent entry should count as {defaultColumnVisibility}.
   Once the board data is got, all values are initialised
   */
  columnVisibilities: Map<number, boolean>;
}

const DEFAULT_STATE: UserSettingState = {
  boardCode: '',
  showBacklog: false,
  swimlane: undefined,
  filters: initialBoardFilterState,
  defaultColumnVisibility: true,
  columnVisibilities: Map<number, boolean>()
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
