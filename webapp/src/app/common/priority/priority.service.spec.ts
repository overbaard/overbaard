import {async, getTestBed, TestBed} from '@angular/core/testing';
import {StoreModule} from '@ngrx/store';
import {reducer} from '../../app-store';
import * as Immutable from 'immutable';
import {Priority} from './priority.model';
import {PriorityService} from './priority.service';

export const PRIORITIES_INPUT = [
  {
    name: 'Blocker',
    icon: '/priorities/blocker.png'
  },
  {
    name: 'Major',
    icon: '/priorities/major.png'
  }
];

describe('Priority service tests', () => {
  let service: PriorityService;
  let priorities: Immutable.OrderedMap<string, Priority>;
  beforeEach(async(() => {
    const input = PRIORITIES_INPUT;

    TestBed.configureTestingModule({
      imports: [StoreModule.provideStore(reducer)],
      providers: [PriorityService]
    });

    const testBed = getTestBed();
    service = testBed.get(PriorityService);

    service.getPriorities().subscribe(
      map => {
        priorities = map; });

    expect(priorities.size).toEqual(0);
    service.deserializePriorities(input);
  }));

  it('Deserialize initial state', () => {
    expect(priorities.size).toEqual(2);

    const keys: string[] = priorities.keySeq().toArray();
    expect(keys[0]).toEqual('Blocker');
    expect(keys[1]).toEqual('Major');

    checkPriority(priorities.get('Blocker'), 'Blocker', '/priorities/blocker.png');
    checkPriority(priorities.get('Major'), 'Major', '/priorities/major.png');
  });

  function checkPriority(priority: Priority, name: string, icon: string) {
    expect(priority).toEqual(jasmine.anything());
    expect(priority.name).toEqual(name);
    expect(priority.icon).toEqual(icon);
  }
});


