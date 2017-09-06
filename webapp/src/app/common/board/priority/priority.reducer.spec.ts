import {async} from '@angular/core/testing';
import {initialPriorityState, Priority, PriorityState} from './priority.model';
import {PriorityActions, priorityReducer} from './priority.reducer';
import {cloneObject} from '../../utils/test-util.spec';

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

describe('Priority reducer tests', () => {
  let state: PriorityState;
  beforeEach(async(() => {
    const input = getTestPrioritiesInput();
    state = priorityReducer(initialPriorityState, PriorityActions.createDeserializePriorities(input));
  }));

  it('Deserialize initial state', () => {
    expect(state.priorities.size).toEqual(2);

    const keys: string[] = state.priorities.keySeq().toArray();
    expect(keys[0]).toEqual('Blocker');
    expect(keys[1]).toEqual('Major');

    checkPriority(state.priorities.get('Blocker'), 'Blocker', '/priorities/blocker.png');
    checkPriority(state.priorities.get('Major'), 'Major', '/priorities/major.png');
  });

  function checkPriority(priority: Priority, name: string, icon: string) {
    expect(priority).toEqual(jasmine.anything());
    expect(priority.name).toEqual(name);
    expect(priority.icon).toEqual(icon);
  }
});


