import {DeserializeIssueLookupParams, IssueUtil} from './issue.model';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {List, Map, OrderedMap} from 'immutable';
import {getTestComponentState} from '../component/component.reducer.spec';
import {getTestLabelState} from '../label/label.reducer.spec';
import {getTestFixVersionState} from '../fix-version/fix-version.reducer.spec';
import {CustomField} from '../custom-field/custom-field.model';
import {getTestCustomFieldState} from '../custom-field/custom-field.reducer.spec';
import {Dictionary} from '../../../../common/dictionary';
import {cloneObject} from '../../../../common/object-util';
import {initialProjectState, ProjectState} from '../project/project.model';
import {ProjectActions, projectMetaReducer} from '../project/project.reducer';
import {getTestProjectsInput} from '../project/project.reducer.spec';
import {getTestAssigneeState} from '../assignee/assignee.reducer.spec';
import {getTestPriorityState} from '../priority/priority.reducer.spec';
import {getTestIssueTypeState} from '../issue-type/issue-type.reducer.spec';
import {BoardIssue} from './board-issue';
import {LinkedIssue} from './linked-issue';

describe('Issue unit tests', () => {

  let lookupParams: DeserializeIssueLookupParams;


  beforeEach(() => {
    const assignees: OrderedMap<string, Assignee> = getTestAssigneeState().assignees;
    const priorities: OrderedMap<string, Priority> = getTestPriorityState().priorities;
    const issueTypes: OrderedMap<string, IssueType> = getTestIssueTypeState().types;
    const components: List<string> = getTestComponentState().components;
    const labels: List<string> = getTestLabelState().labels;
    const fixVersions: List<string> = getTestFixVersionState().versions;
    const customFields: OrderedMap<string, OrderedMap<string, CustomField>> = getTestCustomFieldState().fields;

    const projectState: ProjectState =
      projectMetaReducer(
        initialProjectState,
        ProjectActions.createDeserializeProjects(getTestProjectsInput()));

    lookupParams = new DeserializeIssueLookupParams();

    lookupParams
      .setAssignees(assignees)
      .setPriorities(priorities)
      .setIssueTypes(issueTypes)
      .setComponents(components)
      .setLabels(labels)
      .setFixVersions(fixVersions)
      .setCustomFields(customFields)
      .setBoardProjects(projectState.boardProjects)
      .setLinkedProjects(projectState.linkedProjects)
      .setBoardStates(List<string>(['Board1', 'Board2', 'Board3', 'Board4']))
      .setParallelTasks(projectState.parallelTasks);

  });

  describe('Deserialize', () => {

    let input: any;


    beforeEach(() => {
      input = cloneObject({
        key: 'P2-1',
        type: 0,
        priority: 0,
        summary: 'Issue summary',
        assignee: 0,
        state: 4
      });
    });

    it('Standard fields', () => {
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .check();
    });

    it('Assignee > 0', () => {
      input['assignee'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('kabir'),
        'Issue summary', 4)
        .key('P2-1')
        .check();
    });

    it ('Priority > 0', () => {
      input['priority'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(
        issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Major'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .check();
    });

    it ('Type > 0', () => {
      input['type'] = 1;
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('bug'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .check();
    });

    it ('No assignee', () => {
      delete input['assignee'];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        NO_ASSIGNEE,
        'Issue summary', 4)
        .key('P2-1')
        .check();
    });


    it('Linked issues', () => {
      input['linked-issues'] = [
        {
          key : 'L1-1',
          summary : 'Linked 1',
          state: 3
        },
        {
          key : 'L2-2',
          summary : 'Linked 2',
          state: 0
        }];

      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'), 'Issue summary', 4)
        .key('P2-1')
        .addLinkedIssue('L1-1', 'Linked 1', 3, 'L1-4')
        .addLinkedIssue('L2-2', 'Linked 2', 0, 'L2-1')
        .check();
    });

    it('Components', () => {
      input['components'] = [0, 2];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .components('C-10', 'C-30')
        .check();
    });

    it('Labels', () => {
      input['labels'] = [1, 2];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .labels('L-20', 'L-30')
        .check();
    });


    it('Fix Versions', () => {
      input['fix-versions'] = [0, 1];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .fixVersions('F-10', 'F-20')
        .check();
    });

    it('Custom Fields (all)', () => {
      input['custom'] = {'Custom-1': 2, 'Custom-2': 1};
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .customField('Custom-1', 'c1-C', 'Third C1')
        .customField('Custom-2', 'c2-B', 'Second C2')
        .check();
    });

    it('Custom Fields (one)', () => {
      input['custom'] = {'Custom-2': 0};
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-1')
        .customField('Custom-2', 'c2-A', 'First C2')
        .check();
    });


    it('Parallel Tasks', () => {
      input['key'] = 'P2-100'; // The parallel tasks are set up in the 'P2' project
      input['parallel-tasks'] = [[2, 1], [3]];
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      new IssueChecker(issue,
        lookupParams.issueTypes.get('task'),
        lookupParams.priorities.get('Blocker'),
        lookupParams.assignees.get('bob'),
        'Issue summary', 4)
        .key('P2-100')
        .selectedParallelTaskOptions([2, 1], [3])
        .check();
    });
  });

  describe('Changes - no issue ype overrides', () => {

    let input: any;


    beforeEach(() => {
      input = cloneObject({
        key: 'P2-1',
        type: 0,
        priority: 0,
        summary: 'Issue summary',
        assignee: 0,
        state: 4
      });
    });

    describe('Update', () => {

      it ('State', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', state: 'Test2'
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 1)
          .key('P2-1')
          .check();
      });
      it ('Summary', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', summary: 'Updated summary'
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Updated summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Assignee', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', assignee: 'kabir'
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('kabir'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Clear assignee', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', unassigned: true
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          NO_ASSIGNEE,
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Type', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', type: 'bug'
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('bug'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Priority', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', priority: 'Major'
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Major'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Components', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', components: ['C-10', 'C-20']
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .components('C-10', 'C-20')
          .key('P2-1')
          .check();
      });

      it ('Clear components', () => {
        // Set some components first so we can clear them
        let updated = createAndUpdateIssue({
          key: 'P2-1', components: ['C-10', 'C-20']
        });
        const second = {
          key: 'P2-1', 'clear-components': true
        };
        updated = updateIssue(updated, createIssueMap(updated), second);

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Labels', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', labels: ['L-10', 'L-20']
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .labels('L-10', 'L-20')
          .key('P2-1')
          .check();
      });

      it ('Clear labels', () => {
        // Set some components first so we can clear them
        let updated = createAndUpdateIssue({
          key: 'P2-1', labels: ['L-10', 'L-20']
        });
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            { key: 'P2-1', 'clear-labels': true});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Fix versions', () => {
        const updated = createAndUpdateIssue({
          key: 'P2-1', 'fix-versions': ['F-10', 'F-20']
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .fixVersions('F-10', 'F-20')
          .key('P2-1')
          .check();
      });

      it ('Clear fix versions', () => {
        // Set some components first so we can clear them
        let updated = createAndUpdateIssue({
          key: 'P2-1', 'fix-versions': ['F-10', 'F-20']
        });
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            {key: 'P2-1', 'clear-fix-versions': true});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Custom fields', () => {
        // Update several
        let updated = createAndUpdateIssue({
          key: 'P2-1', custom: {'Custom-1': 'c1-C', 'Custom-2': 'c2-B'}
        });
        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .customField('Custom-1', 'c1-C', 'Third C1')
          .customField('Custom-2', 'c2-B', 'Second C2')
          .key('P2-1')
          .check();
        // Update one
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            {key: 'P2-1', custom: {'Custom-1': 'c1-A'}});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .customField('Custom-1', 'c1-A', 'First C1')
          .customField('Custom-2', 'c2-B', 'Second C2')
          .key('P2-1')
          .check();
      });

      it ('Clear custom field (one)', () => {
        // Create the custom fields first so we can clear them later
        let updated = createAndUpdateIssue({
          key: 'P2-1', custom: {'Custom-1': 'c1-C', 'Custom-2': 'c2-B'}
        });
        // Clear a custom field
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            {key: 'P2-1', custom: {'Custom-1': null}});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .customField('Custom-2', 'c2-B', 'Second C2')
          .key('P2-1')
          .check();
      });

      it ('Clear all custom fields', () => {
        // Create the custom fields first so we can clear them later
        let updated = createAndUpdateIssue({
          key: 'P2-1', custom: {'Custom-1': 'c1-C', 'Custom-2': 'c2-B'}
        });
        // Clear a custom field
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            {key: 'P2-1', custom: {'Custom-1': null, 'Custom-2': null}
        });

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .check();
      });

      it ('Parallel tasks (no existing ones)', () => {
        const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
        // Clear a custom field
        const updated =
          updateIssue(
            issue,
            createIssueMap(issue),
            {key: 'P2-1', 'parallel-tasks': {'0': {'1': 2, '0': 1}, '1': {'0': 0}}});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .selectedParallelTaskOptions([1, 2], [0])
          .check();
      });

      it ('Parallel tasks', () => {
        input['parallel-tasks'] = [[0, 0], [1]];
        const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);

        let updated =
          updateIssue(
            issue,
            createIssueMap(issue),
            {key: 'P2-1', 'parallel-tasks': {'0': {'1': 2}, '1': {'0': 3}}});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .selectedParallelTaskOptions([0, 2], [3])
          .check();

        // Check setting it back to zero again works too
        updated =
          updateIssue(
            updated,
            createIssueMap(updated),
            {key: 'P2-1', 'parallel-tasks': {'0': {'1': 0}}});

        new IssueChecker(updated,
          lookupParams.issueTypes.get('task'),
          lookupParams.priorities.get('Blocker'),
          lookupParams.assignees.get('bob'),
          'Issue summary', 4)
          .key('P2-1')
          .selectedParallelTaskOptions([0, 0], [3])
          .check();

      });
    });

    describe('New issue', () => {
      it ('New issue - minimum info', () => {
        const newIssue =
          updateIssue(
            null,
            createIssueMap(null),
            {
              key: 'P2-1',
              summary: 'Test summary',
              state: 'Test2',
              type: 'bug',
            priority: 'Major'});

        new IssueChecker(newIssue,
          lookupParams.issueTypes.get('bug'),
          lookupParams.priorities.get('Major'),
          NO_ASSIGNEE,
          'Test summary', 1)
          .key('P2-1')
          .check();

      });

      it ('New issue - full info', () => {
        const newIssue =
          updateIssue(
            null,
            createIssueMap(null),
            {
              key: 'P2-1',
              summary: 'Test summary',
              state: 'Test1',
              type: 'bug',
              priority: 'Major',
              assignee: 'kabir',
              components: ['C-10', 'C-20'],
              labels: ['L-10', 'L-20'],
              'fix-versions': ['F-10', 'F-20'],
              custom: {'Custom-1': 'c1-C', 'Custom-2': 'c2-B'},
              'parallel-tasks': {'0': {'1': 2, '0': 1}, '1': {'0': 3}}});


        new IssueChecker(newIssue,
          lookupParams.issueTypes.get('bug'),
          lookupParams.priorities.get('Major'),
          lookupParams.assignees.get('kabir'),
          'Test summary', 0)
          .key('P2-1')
          .components('C-10', 'C-20')
          .labels('L-10', 'L-20')
          .fixVersions('F-10', 'F-20')
          .customField('Custom-1', 'c1-C', 'Third C1')
          .customField('Custom-2', 'c2-B', 'Second C2')
          .selectedParallelTaskOptions([1, 2], [3])
          .check();
      });
    });

    function createAndUpdateIssue(changeInput: any): BoardIssue {
      const issue: BoardIssue = IssueUtil.fromJS(input, lookupParams);
      return updateIssue(issue, createIssueMap(issue), changeInput);
    }

    function updateIssue(issue: BoardIssue, currentIssues: Dictionary<BoardIssue>, changeInput: any): BoardIssue {
      const issueMap: Map<string, BoardIssue> = Map<string, BoardIssue>(currentIssues);
      const change: BoardIssue = IssueUtil.issueChangeFromJs(changeInput, issueMap, lookupParams);
      return IssueUtil.updateIssue(issue, change);
    }

    function createIssueMap(issue: BoardIssue): Dictionary<BoardIssue> {
      const currentIssues: Dictionary<BoardIssue> = {};
      if (issue) {
        currentIssues[issue.key] = issue;
      }
      return currentIssues;
    }
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
  private _parallelTasks: number[][];



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

  addLinkedIssue(key: string, summary: string, state: number, stateName: string): IssueChecker {
    if (!this._linkedIssues) {
      this._linkedIssues = new Array<LinkedIssueChecker>();
    }
    this._linkedIssues.push(new LinkedIssueChecker(key, summary, state, stateName));
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

  selectedParallelTaskOptions(...selectedOptions: number[][]): IssueChecker {
    this._parallelTasks = selectedOptions;
    return this;
  }

  check() {
    expect(this._issue.key).toEqual(this._key);
    expect(this._issue.projectCode).toEqual(IssueUtil.productCodeFromKey(this._key));
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
      expect(this._issue.parallelTasks).toEqual(jasmine.anything());
      const options: List<List<number>> = this._issue.selectedParallelTasks;
      const arrOpts: number[][] = options.map(group => group.toArray()).toArray();
      expect(arrOpts).toEqual(this._parallelTasks);
    } else {
      expect(this._issue.selectedParallelTasks).not.toEqual(jasmine.anything());
    }
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
  constructor(private _key: string, private _summary: string, private _state: number, private _stateName: string) {
  }

  check(issue: LinkedIssue) {
    expect(issue.key).toEqual(this._key);
    expect(issue.summary).toEqual(this._summary);
    expect(issue.state).toEqual(this._state);
    expect(issue.stateName).toEqual(this._stateName);
    expect(issue.colour).toBeTruthy();
  }
}


