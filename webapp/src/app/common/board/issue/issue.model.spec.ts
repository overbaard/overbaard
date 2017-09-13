import {BoardIssue, DeserializeIssueLookupParams, Issue, IssueUtil} from './issue.model';
import {Assignee, AssigneeUtil, NO_ASSIGNEE} from '../assignee/assignee.model';
import {Priority, PriorityUtil} from '../priority/priority.model';
import {IssueType, IssueTypeUtil} from '../issue-type/issue-type.model';
import {List, Map} from 'immutable';
import {getTestComponentsInput} from '../component/component.reducer.spec';
import {getTestLabelsInput} from '../label/label.reducer.spec';
import {getTestFixVersionsInput} from '../fix-version/fix-version.reducer.spec';
import {CustomField, initialCustomFieldState} from '../custom-field/custom-field.model';
import {CustomFieldActions, customFieldReducer} from '../custom-field/custom-field.reducer';
import {getTestCustomFieldsInput} from '../custom-field/custom-field.reducer.spec';
import {Dictionary} from '../../utils/dictionary';
import {cloneObject} from '../../utils/test-util.spec';
import {initialProjectState, ParallelTask, ProjectState} from '../project/project.model';
import {ProjectActions, projectReducer} from '../project/project.reducer';
import {getTestProjectsInput} from '../project/project.reducer.spec';

describe('Issue unit tests', () => {

  describe('Deserialize', () => {
    let input: any;
    let lookupParams: DeserializeIssueLookupParams;
    beforeEach(() => {
      input = cloneObject({
        key: 'ISSUE-1',
        type: 0,
        priority: 0,
        summary: 'Issue summary',
        assignee: 0,
        state: 4
      });

      const assignees: List<Assignee> = List<Assignee>().withMutations(mutable => {
        mutable.push(AssigneeUtil.fromJS(
          {
            key : 'userA',
            email : 'userA@examle.com',
            avatar : 'https://example.com/userA.png',
            name : 'UserA Smith'
          }));
        mutable.push(AssigneeUtil.fromJS(
          {
            key : 'userB',
            email : 'userB@examle.com',
            avatar : 'https://example.com/userB.png',
            name : 'userB Jones'
          }));
      });

      const priorities: List<Priority> = List<Priority>().withMutations(mutable => {
        mutable.push(PriorityUtil.fromJS(
          {
            name: 'Blocker',
            icon: '/priorities/blocker.png'
          }));
        mutable.push(PriorityUtil.fromJS(
          {
            name: 'Major',
            icon: '/priorities/major.png'
          }));
      });

      const issueTypes: List<IssueType> = List<IssueType>().withMutations(mutable => {
        mutable.push(IssueTypeUtil.fromJS(
          {
            name : 'Task',
            icon : 'https://example.com/task.png'
          }));
        mutable.push(IssueTypeUtil.fromJS(
          {
            name : 'Blocker',
            icon : 'https://example.com/blocker.png'
          }));
      });

      const components = List<string>(getTestComponentsInput());
      const labels = List<string>(getTestLabelsInput());
      const fixVersions = List<string>(getTestFixVersionsInput());
      const customFields =
        customFieldReducer(
          initialCustomFieldState,
          CustomFieldActions.createDeserializeCustomFields(getTestCustomFieldsInput())).fields;

      const projectState: ProjectState =
        projectReducer(
          initialProjectState,
          ProjectActions.createDeserializeProjects(getTestProjectsInput()));
      const parallelTasks = projectState.parallelTasks;

      lookupParams = new DeserializeIssueLookupParams();

      lookupParams
        .setAssignees(assignees)
        .setPriorities(priorities)
        .setIssueTypes(issueTypes)
        .setComponents(components)
        .setLabels(labels)
        .setFixVersions(fixVersions)
        .setCustomFields(customFields)
        .setParallelTasks(parallelTasks);
    });

    it('Standard fields', () => {
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .check();
    });

    it('Assignee > 0', () => {
      input['assignee'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(1), 'Issue summary', 4)
        .key('ISSUE-1')
        .check();
    });

    it ('Priority > 0', () => {
      input['priority'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(
        issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(1), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .check();
    });

    it ('Type > 0', () => {
      input['type'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(1), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .check();
    });

    it ('No assignee', () => {
      delete input['assignee'];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), NO_ASSIGNEE, 'Issue summary', 4)
        .key('ISSUE-1')
        .check();
    });


    it('Linked issues', () => {
      input['linked-issues'] = [
        {
          key : 'LNK-1',
          summary : 'Linked 1',
        },
        {
          key : 'LNK-2',
          summary : 'Linked 2',
        }];

      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .addLinkedIssue('LNK-1', 'Linked 1')
        .addLinkedIssue('LNK-2', 'Linked 2')
        .check();
    });

    it('Components', () => {
      input['components'] = [0, 2];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .components('C-10', 'C-30')
        .check();
    });

    it('Labels', () => {
      input['labels'] = [1, 2];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .labels('L-20', 'L-30')
        .check();
    });


    it('Fix Versions', () => {
      input['fix-versions'] = [0, 1];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .fixVersions('F-10', 'F-20')
        .check();
    });

    it('Custom Fields (all)', () => {
      input['custom'] = {'Custom-1': 2, 'Custom-2': 1};
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .customField('Custom-1', 'c1-C', 'Third C1')
        .customField('Custom-2', 'c2-B', 'Second C2')
        .check();
    });

    it('Custom Fields (one)', () => {
      input['custom'] = {'Custom-2': 0};
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('ISSUE-1')
        .customField('Custom-2', 'c2-A', 'First C2')
        .check();
    });


    it('Parallel Tasks', () => {
      input['key'] = 'P2-100'; // The parallel tasks are set up in the 'P2' project
      input['parallel-tasks'] = [2, 1];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Issue summary', 4)
        .key('P2-100')
        .selectedParallelTaskOptions('Three', 'Dos')
        .check();
    });
  });
});

export class IssueChecker {
  private _issue: BoardIssue;
  private _key: string;
  private _type: IssueType;
  private _priority: Priority;
  private _assignee: Assignee;
  private _summary: string;
  private _ownState: number;
  private _linkedIssues: LinkedIssueChecker[];
  private _components: string[];
  private _labels: string[];
  private _fixVersions: string[];
  private _customFields: Dictionary<CustomField>;
  private _parallelTasks: string[];



  constructor(issue: BoardIssue, type: IssueType, priority: Priority, assignee: Assignee, summary: string, ownState: number) {
    this._issue = issue;
    this._key = issue.key;
    this._type = type;
    this._priority = priority;
    this._assignee = assignee;
    this._summary = summary;
    this._ownState = ownState;
  }

  key(key: string): IssueChecker {
    this._key = key;
    return this;
  }

  addLinkedIssue(key: string, summary: string): IssueChecker {
    if (!this._linkedIssues) {
      this._linkedIssues = new Array<LinkedIssueChecker>();
    }
    this._linkedIssues.push(new LinkedIssueChecker(key, summary));
    return this;
  }
  components(...components: string[]): IssueChecker {
    this._components = components;
    return this;
  }

  labels(...labels: string[]): IssueChecker {
    this._labels = labels;
    return this;
  }

  fixVersions(...fixVersions: string[]): IssueChecker {
    this._fixVersions = fixVersions;
    return this;
  }

  customField(field: string, key: string, value: string): IssueChecker {
    if (!this._customFields) {
      this._customFields = {};
    }
    this._customFields[field] = {
      key: key,
      value: value
    };
    return this;
  }

  selectedParallelTaskOptions(...selectedOptions: string[]): IssueChecker {
    this._parallelTasks = selectedOptions;
    return this;
  }

  check() {
    expect(this._issue.key).toEqual(this._key);
    if (this._assignee) {
      expect(this._issue.assignee).toBe(this._assignee);
    } else {
      expect(this._issue.assignee).not.toEqual(jasmine.anything());
    }

    expect(this._issue.priority).toBe(this._priority);
    expect(this._issue.type).toBe(this._type);

    if (this._components) {
      this.checkMultiSelectStringFieldValues(this._issue.components.toArray(), this._components);
    } else {
      expect(this._issue.components).not.toEqual(jasmine.anything());
    }

    if (this._labels) {
      this.checkMultiSelectStringFieldValues(this._issue.labels.toArray(), this._labels);
    } else {
      expect(this._issue.labels).not.toEqual(jasmine.anything());
    }

    if (this._fixVersions) {
      this.checkMultiSelectStringFieldValues(this._issue.fixVersions.toArray(), this._fixVersions);
    } else {
      expect(this._issue.fixVersions).not.toEqual(jasmine.anything(), this._issue.key);
    }

    if (this._summary) {
      expect(this._issue.summary).toEqual(this._summary);
    }

    expect(this._issue.ownState).toBe(this._ownState);

    if (this._linkedIssues) {
      expect(this._issue.linkedIssues).toBeTruthy();
      expect(this._issue.linkedIssues.size).toEqual(this._linkedIssues.length);
      this._issue.linkedIssues.forEach((issue, index) => {
        this._linkedIssues[index].check(this._issue.linkedIssues.get(index));
      });
    } else {
      expect(this._issue.linkedIssues).toBeTruthy();
      expect(this._issue.linkedIssues.size).toEqual(0);
    }

    if (this._customFields) {
      const issueFieldNames: string[] = this._issue.customFields.keySeq().toArray().sort();
      const expectedFieldNames: string[] = Object.keys(this._customFields);
      expect(expectedFieldNames).toEqual(issueFieldNames);

      for (const fieldName of issueFieldNames) {
        const customField: CustomField = this._issue.customFields.get(fieldName);
        const expectedField: CustomField = this._customFields[fieldName];
        expect(customField).toEqual(jasmine.anything());
        expect(customField.key).toEqual(expectedField.key);
        expect(customField.value).toEqual(expectedField.value);
      }
    } else {
      expect(this._issue.customFields).toEqual(Map<string, CustomField>());
    }

    if (this._parallelTasks) {
      const options: List<string> = this._issue.parallelTasks;
      expect(options.toArray()).toEqual(this._parallelTasks);
    } else {
      expect(this._issue.parallelTasks).not.toEqual(jasmine.anything());
    }

    // checkIssueConvenienceMethods(this._issue);
  }

  private checkMultiSelectStringFieldValues(issueValues: string[], keys: string[]) {
    expect(issueValues).toEqual(jasmine.anything());
    expect(issueValues.length).toEqual(keys.length);
    for (let i = 0 ; i < keys.length ; i++) {
      expect(keys).toContain(issueValues[i]);
    }
  }
}


class LinkedIssueChecker {
  private _key: string;
  private _summary: string;
  // state: string;

  constructor(key: string, summary: string) {
    this._key = key;
    this._summary = summary;
  }

  check(issue: Issue) {
    expect(issue.key).toEqual(this._key);
    expect(issue.summary).toEqual(this._summary);
  }
}

