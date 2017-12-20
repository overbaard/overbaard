import {List, OrderedMap} from 'immutable';
import {LogEntry} from './log-entry';

export interface ProgressLogState {
  // The number of active requests
  loading: number;
  messages: List<LogEntry>;
  notLoggedIn: boolean;
}
