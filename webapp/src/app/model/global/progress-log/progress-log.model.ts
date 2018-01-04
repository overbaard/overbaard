
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {ProgressLogState} from './progress-log';
import {LogEntry} from './log-entry';
import {List} from 'immutable';

const DEFAULT_STATE: ProgressLogState = {
  loading: 0,
  messages: List<LogEntry>(),
  notLoggedIn: false,
  externallyDismissFirstMessage: false
};

interface ProgressLogStateRecord extends TypedRecord<ProgressLogStateRecord>, ProgressLogState {
}

const STATE_FACTORY = makeTypedFactory<ProgressLogState, ProgressLogStateRecord>(DEFAULT_STATE);
export const initialProgressLogState: ProgressLogState = STATE_FACTORY(DEFAULT_STATE);

export class ProgressLogUtil {

  static updateProgressLogState(progressLog: ProgressLogState, mutate: (mutable: ProgressLogState) => any): ProgressLogState {
    return (<ProgressLogStateRecord>progressLog).withMutations(mutable => {
      return mutate(mutable);
    });
  }
}
