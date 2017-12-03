import {List, OrderedMap} from 'immutable';
import {LogEntry} from './log-entry';

export interface ProgressLogState {
  loading: boolean,
  messages: List<LogEntry>,
  unseen: boolean,
  notLoggedIn: boolean
}
