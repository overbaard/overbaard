import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List} from 'immutable';


export interface ComponentState {
  components: List<string>;
}

const DEFAULT_STATE: ComponentState = {
  components: List<string>()
};

interface ComponentStateRecord extends TypedRecord<ComponentStateRecord>, ComponentState {
}

const STATE_FACTORY = makeTypedFactory<ComponentState, ComponentStateRecord>(DEFAULT_STATE);
export const initialComponentState: ComponentState = STATE_FACTORY(DEFAULT_STATE);

export class ComponentUtil {

  static withMutations(s: ComponentState, mutate: (mutable: ComponentState) => any): ComponentState {
    return (<ComponentStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}

