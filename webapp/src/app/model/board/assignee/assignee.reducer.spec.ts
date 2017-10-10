import {async} from '@angular/core/testing';
import {Assignee, AssigneeState, initialAssigneeState} from './assignee.model';
import {AssigneeActions, assigneeReducer} from './assignee.reducer';
import {cloneObject} from '../../../common/object-util';

export function getTestAssigneesInput(): any {
  return cloneObject([
    {
      key: 'bob',
      name: 'Bob Brent Barlow',
      email: 'bob@example.com',
      avatar: 'https://example.com/bob.png'
    },
    {
      key: 'kabir',
      name: 'Kabir Khan',
      email: 'kabir@example.com',
      avatar: 'https://example.com/kabir.png'
    }
  ]);
}

export function getTestAssigneeState(): AssigneeState {
  const input = getTestAssigneesInput();
  return assigneeReducer(initialAssigneeState, AssigneeActions.createAddInitialAssignees(input));
}

describe('Assignee reducer tests', () => {
  let assigneeState: AssigneeState;
  beforeEach(async(() => {
    assigneeState = getTestAssigneeState();
  }));

  it('Deserialize', () => {
    it('Initial state', () => {
      expect(assigneeState.assignees.size).toEqual(2);
      const keys: string[] = assigneeState.assignees.keySeq().toArray();
      expect(keys[0]).toEqual('bob');
      expect(keys[1]).toEqual('kabir');

      checkAssignee(assigneeState.assignees.get('bob'),
        'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
      checkAssignee(assigneeState.assignees.get('kabir'),
        'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
    });

    it ('Same', () => {
      const newState: AssigneeState =
        assigneeReducer(assigneeState, AssigneeActions.createAddInitialAssignees(getTestAssigneesInput()));
      expect(newState).toBe(assigneeState);
    });
  });

  it( 'Changes', () => {
    it('Add new assignees', () => {
      assigneeState = assigneeReducer(assigneeState, AssigneeActions.createAddAssignees([{
        key: 'z-fun',
        name: 'Fun Freddy Fox',
        email: 'fun@example.com',
        avatar: 'https://example.com/fun.png'},
        {
          key: 'a-list',
          name: 'Sylvester Superstar',
          email: 'sly@example.com',
          avatar: 'https://example.com/a-list.png'
        }]));
      expect(assigneeState.assignees.size).toEqual(4);

      const keys: string[] = assigneeState.assignees.keySeq().toArray();
      expect(keys[0]).toEqual('bob');
      expect(keys[1]).toEqual('z-fun');
      expect(keys[2]).toEqual('kabir');
      expect(keys[3]).toEqual('a-list');

      checkAssignee(assigneeState.assignees.get('bob'),
        'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
      checkAssignee(assigneeState.assignees.get('z-fun'),
        'z-fun', 'Fun Freddy Fox', 'FFF', 'fun@example.com', 'https://example.com/fun.png');
      checkAssignee(assigneeState.assignees.get('kabir'),
        'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
      checkAssignee(assigneeState.assignees.get('a-list'),
        'a-list', 'Sylvester Superstar', 'SS', 'sly@example.com', 'https://example.com/a-list.png');
    });

    it ('No change', () => {
      const newState = assigneeReducer(assigneeState, AssigneeActions.createAddAssignees(null));
      expect(newState).toBe(assigneeState);
    });
  });

  function checkAssignee(assignee: Assignee, key: string, name: string, initials: string, email: string, avatar: string) {
    expect(assignee).toEqual(jasmine.anything());
    expect(assignee.key).toEqual(key);
    expect(assignee.name).toEqual(name);
    expect(assignee.initials).toEqual(initials);
    expect(assignee.email).toEqual(email);
    expect(assignee.avatar).toEqual(avatar);
  }
});


