import {async, getTestBed} from '@angular/core/testing';
import {Assignee, AssigneeState, initialAssigneeState} from './assignee.model';
import {AssigneeActions, assigneeReducer} from './assignee.reducer';

export const ASSIGNEES_INPUT: any = [
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
];

describe('Assignee reducer tests', () => {
  let assigneeState: AssigneeState;
  beforeEach(async(() => {
    const input = ASSIGNEES_INPUT;

    const testBed = getTestBed();
    assigneeState = assigneeReducer(initialAssigneeState, AssigneeActions.createAddInitialAssignees(input));
  }));

  it('Deserialize initial state', () => {
    expect(assigneeState.assignees.size).toEqual(2);
    const keys: string[] = assigneeState.assignees.keySeq().toArray();
    expect(keys[0]).toEqual('bob');
    expect(keys[1]).toEqual('kabir');

    checkAssignee(assigneeState.assignees.get('bob'),
      'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
    checkAssignee(assigneeState.assignees.get('kabir'),
      'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
  });

  it('Add new assignee', () => {
    assigneeState = assigneeReducer(assigneeState, AssigneeActions.createAddAssignees([{
      key: 'z-fun',
      name: 'Fun Freddy Fox',
      email: 'fun@example.com',
      avatar: 'https://example.com/fun.png'
    }]));
    expect(assigneeState.assignees.size).toEqual(3);

    const keys: string[] = assigneeState.assignees.keySeq().toArray();
    expect(keys[0]).toEqual('bob');
    expect(keys[1]).toEqual('z-fun');
    expect(keys[2]).toEqual('kabir');

    checkAssignee(assigneeState.assignees.get('bob'),
      'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
    checkAssignee(assigneeState.assignees.get('z-fun'),
      'z-fun', 'Fun Freddy Fox', 'FFF', 'fun@example.com', 'https://example.com/fun.png');
    checkAssignee(assigneeState.assignees.get('kabir'),
      'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
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


