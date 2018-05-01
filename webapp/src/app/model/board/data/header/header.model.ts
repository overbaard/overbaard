import {List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from './header.state';

const DEFAULT_STATE: HeaderState = {
  states: List<string>(),
  helpTexts: Map<string, string>(),
  wip: List<number>(),
  categories: List<string>(),
  stateToCategoryMappings: List<number>(),
  backlog: 0
};

interface HeaderStateRecord extends TypedRecord<HeaderStateRecord>, HeaderState {
}


const STATE_FACTORY = makeTypedFactory<HeaderState, HeaderStateRecord>(DEFAULT_STATE);
export const initialHeaderState: HeaderState = STATE_FACTORY(DEFAULT_STATE);

export class HeaderUtil {
  static withMutations(s: HeaderState, mutate: (mutable: HeaderState) => any): HeaderState {
    return (<HeaderStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}
