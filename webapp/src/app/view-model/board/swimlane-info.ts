import {OrderedMap} from 'immutable';
import {SwimlaneData} from './swimlane-data';

export interface SwimlaneInfo {
  showEmpty: boolean;
  visibleSwimlanes: OrderedMap<string, SwimlaneData>;
  allSwimlanes: OrderedMap<string, SwimlaneData>;
}
