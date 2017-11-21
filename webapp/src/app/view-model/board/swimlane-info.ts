import {OrderedMap} from 'immutable';
import {SwimlaneData} from './swimlane-data';

export interface SwimlaneInfo {
  showEmpty: boolean;
  swimlanes: OrderedMap<string, SwimlaneData>;
}
