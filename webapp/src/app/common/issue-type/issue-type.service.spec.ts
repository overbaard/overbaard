import {async, getTestBed, TestBed} from '@angular/core/testing';
import {StoreModule} from '@ngrx/store';
import {reducer} from '../../app-store';
import * as Immutable from 'immutable';
import {IssueType} from './issue-type.model';
import {IssueTypeService} from './issue-type.service';

describe('Issue Type service tests', () => {
  let service: IssueTypeService;
  let issueTypes: Immutable.OrderedMap<string, IssueType>;
  beforeEach(async(() => {
    const input = [
      {
        name: 'task',
        icon: '/types/task.png'
      },
      {
        name: 'bug',
        icon: '/types/bug.png'
      }
    ];

    TestBed.configureTestingModule({
      imports: [StoreModule.provideStore(reducer)],
      providers: [IssueTypeService]
    });

    const testBed = getTestBed();
    service = testBed.get(IssueTypeService);

    service.getIssueTypes().subscribe(
      map => {
        issueTypes = map; });

    expect(issueTypes.size).toEqual(0);
    service.deserializeIssueTypes(input);
  }));

  it('Deserialize initial state', () => {
    expect(issueTypes.size).toEqual(2);

    const keys: string[] = issueTypes.keySeq().toArray();
    expect(keys[0]).toEqual('task');
    expect(keys[1]).toEqual('bug');

    checkIssueType(issueTypes.get('task'), 'task', '/types/task.png');
    checkIssueType(issueTypes.get('bug'), 'bug', '/types/bug.png');
  });

  function checkIssueType(issueType: IssueType, name: string, icon: string) {
    expect(issueType).toEqual(jasmine.anything());
    expect(issueType.name).toEqual(name);
    expect(issueType.icon).toEqual(icon);
  }
});


