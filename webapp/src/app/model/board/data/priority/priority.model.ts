import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {OrderedMap} from 'immutable';


export interface PriorityState {
  priorities: OrderedMap<string, Priority>;
}

export interface Priority {
  name: string;
  colour: string;
}

const DEFAULT_STATE: PriorityState = {
  priorities: OrderedMap<string, Priority>()
};

const DEFAULT_PRIORITY: Priority = {
  name: null,
  colour: null
};

interface PriorityRecord extends TypedRecord<PriorityRecord>, Priority {
}

interface PriorityStateRecord extends TypedRecord<PriorityStateRecord>, PriorityState {
}

const STATE_FACTORY = makeTypedFactory<PriorityState, PriorityStateRecord>(DEFAULT_STATE);
const PRIORITY_FACTORY = makeTypedFactory<Priority, PriorityRecord>(DEFAULT_PRIORITY);
export const initialPriorityState: PriorityState = STATE_FACTORY(DEFAULT_STATE);

export class PriorityUtil {
  static fromJS(input: any): Priority {
    return PRIORITY_FACTORY(input);
  }

  static withMutations(s: PriorityState, mutate: (mutable: PriorityState) => any): PriorityState {
    return (<PriorityStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
};

