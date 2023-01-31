import { waitForAsync } from '@angular/core/testing';
import {initialPriorityState, Priority, PriorityState} from './priority.model';
import {PriorityActions, priorityMetaReducer} from './priority.reducer';
import {cloneObject} from '../../../../common/object-util';
import {initialLabelState, LabelState} from '../label/label.model';
import {LabelActions, labelMetaReducer} from '../label/label.reducer';
import {getTestLabelsInput} from '../label/label.reducer.spec';

export function getTestPrioritiesInput(): any {
  return cloneObject([{
      name: 'Blocker',
      colour: 'red'
    },
    {
      name: 'Major',
      colour: 'orange'
    }
  ]);
}

export function getTestPriorityState(): PriorityState {
  const input = getTestPrioritiesInput();
  return priorityMetaReducer(initialPriorityState, PriorityActions.createDeserializePriorities(input));
}

describe('Priority reducer tests', () => {
  let state: PriorityState;
  beforeEach(waitForAsync(() => {
    state = getTestPriorityState();
  }));

  it('Deserialize initial state', () => {
    expect(state.priorities.size).toEqual(2);

    const keys: string[] = state.priorities.keySeq().toArray();
    expect(keys[0]).toEqual('Blocker');
    expect(keys[1]).toEqual('Major');

    checkPriority(state.priorities.get('Blocker'), 'Blocker', 'red');
    checkPriority(state.priorities.get('Major'), 'Major', 'orange');
  });

  it ('Deserialize same state', () => {
    const stateA: LabelState =
      labelMetaReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    const stateB: LabelState =
      labelMetaReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    expect(stateA).toBe(stateB);
  });

  function checkPriority(priority: Priority, name: string, colour: string) {
    expect(priority).toEqual(jasmine.anything());
    expect(priority.name).toEqual(name);
    expect(priority.colour).toEqual(colour);
  }
});


