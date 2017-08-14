import {async, getTestBed, TestBed} from '@angular/core/testing';
import {Assignee} from './assignee.model';
import {AssigneeService} from './assignee.service';
import {StoreModule} from '@ngrx/store';
import {reducer} from '../../app-store';
import * as Immutable from 'immutable';

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

describe('Assignee service tests', () => {
  let service: AssigneeService;
  let assignees: Immutable.OrderedMap<string, Assignee>;
  beforeEach(async(() => {
    const input = ASSIGNEES_INPUT;

    TestBed.configureTestingModule({
      imports: [StoreModule.provideStore(reducer)],
      providers: [AssigneeService]
    });

    const testBed = getTestBed();
    service = testBed.get(AssigneeService);

    service.getAssignees().subscribe(
      map => {
        assignees = map; });

    expect(assignees.size).toEqual(0);
    service.deserializeInitialAssignees(input);
  }));

  it('Deserialize initial state', () => {
    expect(assignees.size).toEqual(2);

    const keys: string[] = assignees.keySeq().toArray();
    expect(keys[0]).toEqual('bob');
    expect(keys[1]).toEqual('kabir');

    checkAssignee(assignees.get('bob'), 'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
    checkAssignee(assignees.get('kabir'), 'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
  });

  it('Add new assignee', () => {
    service.deserializeAddedAssignees([{
      key: 'z-fun',
      name: 'Fun Freddy Fox',
      email: 'fun@example.com',
      avatar: 'https://example.com/fun.png'
    }]);
    expect(assignees.size).toEqual(3);

    const keys: string[] = assignees.keySeq().toArray();
    expect(keys[0]).toEqual('bob');
    expect(keys[1]).toEqual('z-fun');
    expect(keys[2]).toEqual('kabir');

    checkAssignee(assignees.get('bob'), 'bob', 'Bob Brent Barlow', 'BBB', 'bob@example.com', 'https://example.com/bob.png');
    checkAssignee(assignees.get('z-fun'), 'z-fun', 'Fun Freddy Fox', 'FFF', 'fun@example.com', 'https://example.com/fun.png');
    checkAssignee(assignees.get('kabir'), 'kabir', 'Kabir Khan', 'KK', 'kabir@example.com', 'https://example.com/kabir.png');
  });

  it('Clear all', () => {
    service.clearAssignees();
    expect(assignees.size).toEqual(0);
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


