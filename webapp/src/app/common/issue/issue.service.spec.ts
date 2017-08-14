import * as Immutable from 'immutable';
import {AssigneeService} from '../assignee/assignee.service';
import {IssueService} from './issue.service';
import {BoardIssue} from './issue.model';
import {async, getTestBed, TestBed} from '@angular/core/testing';
import {StoreModule} from '@ngrx/store';
import {reducer} from '../../app-store';
import {IssueTypeService} from '../issue-type/issue-type.service';
import {PriorityService} from '../priority/priority.service';
import {ASSIGNEES_INPUT} from '../assignee/assignee.service.spec';
import {ISSUE_TYPES_INPUT} from '../issue-type/issue-type.service.spec';
import {PRIORITIES_INPUT} from '../priority/priority.service.spec';
import {IssueChecker} from './issue.model.spec';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import {IssueType} from '../issue-type/issue-type.model';
import {Priority} from '../priority/priority.model';

describe('Issue Service tests', () => {

  let service: IssueService;
  let types: Array<IssueType>;
  let priorities: Array<Priority>;
  let assignees: Array<Assignee>;
  let issues: Immutable.Map<string, BoardIssue>;
  beforeEach(async(() => {

    const input = [
      {
        key: 'ISSUE-1',
        type: 0,
        priority: 0,
        summary: 'One',
        assignee: 0,
        'linked-issues' : [
          {
            key : 'LNK-1',
            summary : 'Linked 1',
          }]
      },
      {
        key: 'ISSUE-2',
        type: 1,
        priority: 1,
        summary: 'Two',
        assignee: 1
      },
      {
        key: 'ISSUE-3',
        type: 0,
        priority: 0,
        summary: 'Three',
        assignee: 0
      },
      {
        key: 'ISSUE-4',
        type: 0,
        priority: 1,
        summary: 'Four'
      }
    ];

    TestBed.configureTestingModule({
      imports: [StoreModule.provideStore(reducer)],
      providers: [AssigneeService, IssueTypeService, PriorityService, IssueService]
    });

    const testBed = getTestBed();
    const assigneeService: AssigneeService = <AssigneeService>testBed.get(AssigneeService);
    const priorityService: PriorityService = <PriorityService>testBed.get(PriorityService);
    const issueTypeService: IssueTypeService = <IssueTypeService>testBed.get(IssueTypeService);


    assigneeService.deserializeInitialAssignees(ASSIGNEES_INPUT);
    priorityService.deserializePriorities(PRIORITIES_INPUT);
    issueTypeService.deserializeIssueTypes(ISSUE_TYPES_INPUT);

    service = testBed.get(IssueService);

    service.getIssues().subscribe(map => { issues = map; });
    assigneeService.getAssignees().subscribe(map => { assignees = map.toArray(); });
    priorityService.getPriorities().subscribe(map => { priorities = map.toArray(); });
    issueTypeService.getIssueTypes().subscribe( map => { types = map.toArray(); });

    expect(issues.size).toEqual(0);

    service.deserializeIssues(input);
  }));


  it('Deserialize', () => {
    expect(issues.size).toEqual(4);
    const issueArray: BoardIssue[] = issues.toArray();
    new IssueChecker(issueArray[0], types[0], priorities[0], assignees[0], 'One')
      .key('ISSUE-1')
      .addLinkedIssue('LNK-1', 'Linked 1')
      .check();
    new IssueChecker(issueArray[1], types[1], priorities[1], assignees[1], 'Two')
      .key('ISSUE-2')
      .check();
    new IssueChecker(issueArray[2], types[0], priorities[0], assignees[0], 'Three')
      .key('ISSUE-3')
      .check();
    new IssueChecker(issueArray[3], types[0], priorities[1], NO_ASSIGNEE, 'Four')
      .key('ISSUE-4')
      .check();
  });
});
