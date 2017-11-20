import {OrderedMap} from 'immutable';
import {SwimlaneData} from './swimlane-data';

export interface SwimlaneInfo {
  swimlanes: OrderedMap<string, SwimlaneData>;
}
