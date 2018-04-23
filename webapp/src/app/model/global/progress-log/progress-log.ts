import {List} from 'immutable';
import {LogEntry} from './log-entry';

export interface ProgressLogState {
  // The number of active requests
  loading: number;
  messages: List<LogEntry>;
  notLoggedIn: boolean;
  // Hook for other components than the app component to dismiss messages in the snackbar
  externallyDismissFirstMessage;
}
