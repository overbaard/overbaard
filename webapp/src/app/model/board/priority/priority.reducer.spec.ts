import {async} from '@angular/core/testing';
import {initialPriorityState, Priority, PriorityState} from './priority.model';
import {PriorityActions, priorityReducer} from './priority.reducer';
import {cloneObject} from '../../../common/object-util';
import {initialLabelState, LabelState} from '../label/label.model';
import {LabelActions, labelReducer} from '../label/label.reducer';
import {getTestLabelsInput} from '../label/label.reducer.spec';

export function getTestPrioritiesInput(): any {
  return cloneObject([{
      name: 'Blocker',
      icon: '/priorities/blocker.png'
    },
    {
      name: 'Major',
      icon: '/priorities/major.png'
    }
  ]);
}

export function getTestPriorityState(): PriorityState {
  const input = getTestPrioritiesInput();
  return priorityReducer(initialPriorityState, PriorityActions.createDeserializePriorities(input));
}

describe('Priority reducer tests', () => {
  let state: PriorityState;
  beforeEach(async(() => {
    state = getTestPriorityState();
  }));

  it('Deserialize initial state', () => {
    expect(state.priorities.size).toEqual(2);

    const keys: string[] = state.priorities.keySeq().toArray();
    expect(keys[0]).toEqual('Blocker');
    expect(keys[1]).toEqual('Major');

    checkPriority(state.priorities.get('Blocker'), 'Blocker', '/priorities/blocker.png');
    checkPriority(state.priorities.get('Major'), 'Major', '/priorities/major.png');
  });

  it ('Deserialize same state', () => {
    const stateA: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    const stateB: LabelState =
      labelReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    expect(stateA).toBe(stateB);
  });

  function checkPriority(priority: Priority, name: string, icon: string) {
    expect(priority).toEqual(jasmine.anything());
    expect(priority.name).toEqual(name);
    expect(priority.icon).toEqual(icon);
  }
});


