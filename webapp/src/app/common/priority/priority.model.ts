import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {OrderedMap} from 'immutable';


export interface PriorityState {
  priorities: OrderedMap<string, Priority>;
}

export interface Priority {
  name: string;
  icon: string;
}

const DEFAULT_STATE: PriorityState = {
  priorities: OrderedMap<string, Priority>()
};

const DEFAULT_PRIORITY: Priority = {
  name: null,
  icon: null
};

interface PriorityRecord extends TypedRecord<PriorityRecord>, Priority {
}

interface PriorityStateRecord extends TypedRecord<PriorityStateRecord>, PriorityState {
}

const STATE_FACTORY = makeTypedFactory<PriorityState, PriorityStateRecord>(DEFAULT_STATE);
const PRIORITY_FACTORY = makeTypedFactory<Priority, PriorityRecord>(DEFAULT_PRIORITY);
export const initialPriorityState: PriorityState = STATE_FACTORY(DEFAULT_STATE);

export class PriorityFactory {
  static fromJS(input: any): Priority {
    return PRIORITY_FACTORY(input);
  }
};

export class PriorityStateModifier {
  static update(state: PriorityState, updater: (copy: PriorityState) => void) {
    return (<PriorityStateRecord>state).withMutations(updater);
  }
}

