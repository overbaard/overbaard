import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List, OrderedMap} from 'immutable';


export interface ComponentState {
  components: List<string>;
}

const DEFAULT_STATE: ComponentState = {
  components: List<string>()
};

export interface ComponentStateRecord extends TypedRecord<ComponentStateRecord>, ComponentState {
}

const STATE_FACTORY = makeTypedFactory<ComponentState, ComponentStateRecord>(DEFAULT_STATE);
export const initialComponentState: ComponentState = STATE_FACTORY(DEFAULT_STATE);

export class ComponentStateModifier {
  static update(state: ComponentState, updater: (copy: ComponentState) => void) {
    return (<ComponentStateRecord>state).withMutations(updater);
  }
}

