import {BoardFilterState} from './board-filter/board-filter.model';
import {Map} from 'immutable';

export interface UserSettingState {
  boardCode: string;
  showBacklog: boolean;
  swimlane: string;
  swimlaneShowEmpty: boolean;
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
