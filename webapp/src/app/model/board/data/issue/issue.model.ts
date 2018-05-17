import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {fromJS, List, Map, OrderedMap, OrderedSet} from 'immutable';
import {CustomField} from '../custom-field/custom-field.model';
import {BoardProject, LinkedProject, ParallelTask} from '../project/project.model';
import {cloneObject} from '../../../../common/object-util';
import {BoardIssue} from './board-issue';
import {LinkedIssue} from './linked-issue';
import {ColourTable} from '../../../../common/colour-table';

export interface IssueState {
  issues: Map<string, BoardIssue>;
  lastChanged: Map<string, IssueChangeInfo>;
}

export interface IssueChangeInfo {
  key: string;
  change: IssueChange;
}

export enum IssueChange {
  NEW, UPDATE, DELETE
}


const DEFAULT_STATE: IssueState = {
  issues: Map<string, BoardIssue>(),
  lastChanged: null
};

const DEFAULT_ISSUE: BoardIssue = {
  key: null,
  projectCode: null,
  summary: null,
  assignee: NO_ASSIGNEE,
  priority: null,
  type: null,
  components: null,
  labels: null,
  fixVersions: null,
  customFields: Map<string, CustomField>(),
  parallelTasks: null,
  selectedParallelTasks: null,
  linkedIssues: List<LinkedIssue>(),
  ownState: -1
};

const DEFAULT_LINKED_ISSUE: LinkedIssue = {
  key: null,
  summary: null,
  state: null,
  stateName: null,
  colour: null
};

const DEFAULT_ISSUE_CHANGE_INFO: IssueChangeInfo = {
  key: null,
  change: null
};


interface BoardIssueRecord extends TypedRecord<BoardIssueRecord>, BoardIssue {
}

interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, LinkedIssue {
}

interface IssueStateRecord extends TypedRecord<IssueStateRecord>, IssueState {
}

interface IssueChangeInfoRecord extends TypedRecord<IssueChangeInfoRecord>, IssueChangeInfo {
}

const ISSUE_FACTORY = makeTypedFactory<BoardIssue, BoardIssueRecord>(DEFAULT_ISSUE);
const LINKED_ISSUE_FACTORY = makeTypedFactory<LinkedIssue, LinkedIssueRecord>(DEFAULT_LINKED_ISSUE);
const STATE_FACTORY = makeTypedFactory<IssueState, IssueStateRecord>(DEFAULT_STATE);
const ISSUE_CHANGE_INFO_FACTORY = makeTypedFactory<IssueChangeInfo, IssueChangeInfoRecord>(DEFAULT_ISSUE_CHANGE_INFO);
export const initialIssueState: IssueState = STATE_FACTORY(DEFAULT_STATE);

const CLEAR_STRING_LIST = OrderedSet<string>('Clear this!');
/**
 * Convenience class to make it easier to pass in other data needed to deserialize an issue. Especially from unit tests,
 * where we do this repeatedly and not all data is always needed.
 */
export class DeserializeIssueLookupParams {
  private _assignees: OrderedMap<string, Assignee> = OrderedMap<string, Assignee>();
  private _assigneesList: List<Assignee>;
  private _issueTypes: OrderedMap<string, IssueType> = OrderedMap<string, IssueType>();
  private _issueTypesList: List<IssueType>;
  private _priorities: OrderedMap<string, Priority> = OrderedMap<string, Priority>();
  private _prioritiesList: List<Priority>;
  private _components: List<string> = List<string>();
  private _labels: List<string> = List<string>();
  private _fixVersions: List<string> = List<string>();
  private _customFields: OrderedMap<string, OrderedMap<string, CustomField>> = OrderedMap<string, OrderedMap<string, CustomField>>();
  private _customFieldsListMap: OrderedMap<string, List<CustomField>>;
  private _parallelTasks: Map<string, List<List<ParallelTask>>> = Map<string, List<List<ParallelTask>>>();
  private _boardProjects: Map<string, BoardProject> = Map<string, BoardProject>();
  private _linkedProjects: Map<string, LinkedProject> = Map<string, LinkedProject>();
  private _boardStates: List<string>;

  private _ownStateNameToOwnIndexByProject: Map<string, Map<string, number>>;

  setAssignees(value: OrderedMap<string, Assignee>): DeserializeIssueLookupParams {
    this._assignees = value;
    return this;
  }

  setIssueTypes(value: OrderedMap<string, IssueType>): DeserializeIssueLookupParams {
    this._issueTypes = value;
    return this;
  }

  setPriorities(value: OrderedMap<string, Priority>): DeserializeIssueLookupParams {
    this._priorities = value;
    return this;
  }

  setComponents(value: List<string>): DeserializeIssueLookupParams {
    this._components = value;
    return this;
  }

  setLabels(value: List<string>): DeserializeIssueLookupParams {
    this._labels = value;
    return this;
  }

  setFixVersions(value: List<string>): DeserializeIssueLookupParams {
    this._fixVersions = value;
    return this;
  }

  setCustomFields(value: OrderedMap<string, OrderedMap<string, CustomField>>): DeserializeIssueLookupParams {
    this._customFields = value;
    return this;
  }

  setParallelTasks(value: Map<string, List<List<ParallelTask>>>): DeserializeIssueLookupParams {
    this._parallelTasks = value;
    return this;
  }

  setBoardProjects(value: Map<string, BoardProject>): DeserializeIssueLookupParams {
    this._boardProjects = value;
    return this;
  }

  setLinkedProjects(value: Map<string, LinkedProject>): DeserializeIssueLookupParams {
    this._linkedProjects = value;
    return this;
  }

  setBoardStates(value: List<string>): DeserializeIssueLookupParams {
    this._boardStates = value;
    return this;
  }

  get assignees(): OrderedMap<string, Assignee> {
    return this._assignees;
  }

  get assigneesList(): List<Assignee> {
    if (!this._assigneesList) {
      this._assigneesList = this.assignees.toList();
    }
    return this._assigneesList;
  }

  get issueTypes(): OrderedMap<string, IssueType> {
    return this._issueTypes;
  }

  get issueTypesList(): List<IssueType> {
    if (!this._issueTypesList) {
      this._issueTypesList = this._issueTypes.toList();
    }
    return this._issueTypesList;
  }

  get priorities(): OrderedMap<string, Priority> {
    return this._priorities;
  }

  get prioritiesList(): List<Priority> {
    if (!this._prioritiesList) {
      this._prioritiesList = this._priorities.toList();
    }
    return this._prioritiesList;
  }

  get linkedProjects(): Map<string, LinkedProject> {
    return this._linkedProjects;
  }

  get components(): List<string> {
    return this._components;
  }

  get labels(): List<string> {
    return this._labels;
  }

  get fixVersions(): List<string> {
    return this._fixVersions;
  }

  get customFields(): OrderedMap<string, OrderedMap<string, CustomField>> {
    return this._customFields;
  }

  get customFieldsListMap(): OrderedMap<string, List<CustomField>> {
    if (!this._customFieldsListMap) {
      this._customFieldsListMap = this._customFields.map(value => {
        return value.toList();
      }).toOrderedMap();
    }
    return this._customFieldsListMap;
  }

  get parallelTasks(): Map<string, List<List<ParallelTask>>> {
    return this._parallelTasks;
  }

  getOwnStateNameToOwnIndex(issueKey: string): Map<string, number> {
    if (!this._ownStateNameToOwnIndexByProject) {
      this._ownStateNameToOwnIndexByProject = Map<string, Map<string, number>>();
    }
    const projectCode = IssueUtil.productCodeFromKey(issueKey);
    let ownStateToOwnIndex: Map<string, number> = this._ownStateNameToOwnIndexByProject.get(projectCode);
    if (ownStateToOwnIndex) {
      return ownStateToOwnIndex;
    }
    const boardProject: BoardProject = this._boardProjects.get(projectCode);
    let currentOwnIndex = 0;
    ownStateToOwnIndex = Map<string, number>().withMutations(mutable => {
      this._boardStates.forEach((v) => {
        const ownName: string = boardProject.boardStateNameToOwnStateName.get(v);
        if (ownName) {
          mutable.set(ownName, currentOwnIndex++);
        }
      });
    });
    this._ownStateNameToOwnIndexByProject = this._ownStateNameToOwnIndexByProject.withMutations(mutable => {
      mutable.set(projectCode, ownStateToOwnIndex);
    });
    return ownStateToOwnIndex;
  }
}

export class IssueUtil {

  static fromJS(input: any, params: DeserializeIssueLookupParams): BoardIssue {
    const projectCode: string = IssueUtil.productCodeFromKey(input['key']);

    // Clone this since we will be modifying it, and the data received from the server has been frozen
    input = cloneObject(input);
    input['projectCode'] = projectCode;

    // Rework the data as needed before deserializing
    if (input['linked-issues']) {
      input['linkedIssues'] = input['linked-issues'];
    }
    delete input['linked-issues'];

    if (input['assignee'] || input['assignee'] === 0) {
      input['assignee'] = params.assigneesList.get(input['assignee']);
    } else {
      input['assignee'] = NO_ASSIGNEE;
    }

    input['ownState'] = input['state'];
    delete input['state'];

    // priority and issue-type will never be null
    input['priority'] = params.prioritiesList.get(input['priority']);
    input['type'] = params.issueTypesList.get(input['type']);

    if (input['components']) {
      input['components'] = IssueUtil.lookupStringsFromIndexArray(input['components'], params.components);
    }
    if (input['labels']) {
      input['labels'] = IssueUtil.lookupStringsFromIndexArray(input['labels'], params.labels);
    }
    if (input['fix-versions']) {
      input['fixVersions'] = IssueUtil.lookupStringsFromIndexArray(input['fix-versions'], params.fixVersions);
      delete input['fix-versions'];
    }
    if (input['custom']) {
      const custom = input['custom'];
      input['customFields'] = Map<string, CustomField>().withMutations(mutable => {
        for (const key of Object.keys(custom)) {
          const value = params.customFieldsListMap.get(key).get(custom[key]);
          if (value) {
            mutable.set(key, value);
          }
        }
      });
      delete input['custom'];
    } else {
      input['customFields'] = Map<string, CustomField>();
    }

    if (input['parallel-tasks']) {
      const selectedParallelTasks: List<List<number>> =
        List<List<number>>((<number[][]>input['parallel-tasks']).map(group => List<number>(group)));
      input['parallelTasks'] = params.parallelTasks.get(projectCode);
      input['selectedParallelTasks'] = List<List<number>>(selectedParallelTasks);
      delete input['parallel-tasks'];
    }

    const temp: any = fromJS(input, (key, value) => {
      if (key === 'linkedIssues') {
        const tmp: List<any> = value.toList();
        return tmp.withMutations(mutable => {
          tmp.forEach((li, i) => {
            const data: LinkedIssue = cloneObject(li);
            const projCode: string = IssueUtil.productCodeFromKey(data['key']);
            const project: LinkedProject = params.linkedProjects.get(projCode);
            const stateIndex: number = data['state'];
            data.colour = ColourTable.INSTANCE.getColourTable(project.states.size)[stateIndex];
            data.stateName = project.states.get(stateIndex);
            mutable.set(i, LINKED_ISSUE_FACTORY(<any>data));
          });
        });
      }
      return value;
    });
    return ISSUE_FACTORY(temp);
  }

  static issueChangeFromJs(input: any, params: DeserializeIssueLookupParams): BoardIssue {
    let customFields: Map<string, CustomField>;
    const key: string = input['key'];
    const projectCode: string = IssueUtil.productCodeFromKey(input['key']);
    if (input['custom']) {
      const customInput: any = input['custom'];
      customFields = Map<string, CustomField>().withMutations(mutable => {
        for (const fieldKey of Object.keys(customInput)) {
          const valueKey: string = customInput[fieldKey];

          if (!valueKey) {
            mutable.set(fieldKey, null);
          } else {
            mutable.set(fieldKey, params.customFields.get(fieldKey).get(valueKey));
          }
        }
      });
    }
    let selectedParallelTasks: List<List<number>>;
    if (input['parallel-tasks']) {

      const parallelTasksInput: Object = input['parallel-tasks'];
      const parallelTasks: List<List<ParallelTask>> = params.parallelTasks.get(projectCode);
      const selected: List<number>[] = new Array<List<number>>(parallelTasks.size);

      for (let groupIndex = 0 ; groupIndex < parallelTasks.size ; groupIndex++) {

        const groupKey = String(groupIndex);
        const group = new Array<number>(parallelTasks.get(groupIndex).size);
        const groupInput = parallelTasksInput[groupKey];

        if (groupInput) {
          for (const taskKey of Object.keys(groupInput)) {
            const taskIndex = Number(taskKey);
            group[taskIndex] = groupInput[taskKey];
          }
        }

        selected[groupIndex] = List<number>(group);
      }
      selectedParallelTasks = List<List<number>>(selected);
    }
    return {
      key: key,
      projectCode: projectCode,
      ownState: input['state'] ? params.getOwnStateNameToOwnIndex(input['key']).get(input['state']) : null,
      summary: input['summary'],
      assignee: input['unassigned'] ? NO_ASSIGNEE : params.assignees.get(input['assignee']),
      priority: params.priorities.get(input['priority']),
      type: params.issueTypes.get(input['type']),
      components: IssueUtil.getClearableStringSet(input, 'clear-components', 'components'),
      labels: IssueUtil.getClearableStringSet(input, 'clear-labels', 'labels'),
      fixVersions: IssueUtil.getClearableStringSet(input, 'clear-fix-versions', 'fix-versions'),
      customFields: customFields,
      parallelTasks: params.parallelTasks.get(projectCode),
      selectedParallelTasks: selectedParallelTasks,
      linkedIssues: null // This isn't settable from the events at the moment, and only happens on full board refresh
    };
  }

  static updateIssue(issue: BoardIssue, change: BoardIssue): BoardIssue {
    if (issue == null) {
      issue = ISSUE_FACTORY(DEFAULT_ISSUE);
    }
    issue = (<BoardIssueRecord>issue).withMutations(mutable => {
      for (const key of Object.keys(change)) {
        const value = change[key];
        if (value != null) {
          if (value === CLEAR_STRING_LIST && (key === 'components' || key === 'labels' || key === 'fixVersions')) {
            mutable.set(key, null);
          } else if (key === 'customFields') {
            change.customFields.forEach((cf, cfKey) => {
              if (cf) {
                mutable.customFields = mutable.customFields.set(cfKey, cf);
              } else {
                mutable.customFields = mutable.customFields.delete(cfKey);
              }
            });
          } else if (key === 'selectedParallelTasks') {
              mutable.selectedParallelTasks = mutable.selectedParallelTasks ? mutable.selectedParallelTasks : List<List<number>>();

              change.selectedParallelTasks.forEach((group, groupIndex) => {
                group.forEach((v, taskIndex) => {
                  if (!isNaN(v)) {
                    mutable.selectedParallelTasks = mutable.selectedParallelTasks.setIn([groupIndex, taskIndex], v);
                  }
                });
              });

          } else {
            mutable.set(key, value);
          }
        }
      }
    });
    return issue;
  }

  static createChangeInfo(existing: BoardIssue, current: BoardIssue): IssueChangeInfo {
    const key: string = existing ? existing.key : current.key;
    let changeType: IssueChange;
    if (existing && current) {
      changeType = IssueChange.UPDATE;
    } else if (!current) {
      changeType = IssueChange.DELETE;
    } else {
      changeType = IssueChange.NEW;
    }
    const changeInfo: IssueChangeInfo = {
      key: key,
      change: changeType
    };
    return ISSUE_CHANGE_INFO_FACTORY(changeInfo);
  }

  private static getClearableStringSet(input: any, clearKey: string, key: string): OrderedSet<string> {
    if (input[clearKey]) {
      return CLEAR_STRING_LIST;
    }
    if (input[key]) {
      return List<string>(input[key]).sort((a, b) => a.localeCompare(b)).toOrderedSet();
    }
    return null;
  }

  static withMutations(s: IssueState, mutate: (mutable: IssueState) => any): IssueState {
    return (<IssueStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }

  static issuesEqual(i1: BoardIssue, i2: BoardIssue): boolean {
    if (!i1 && i2) {
      return false;
    }
    return (<BoardIssueRecord>i1).equals(<BoardIssueRecord>i2);
  }

  private static lookupStringsFromIndexArray(input: number[], lookup: List<string>): string[] {
    const strings: string[] = new Array<string>(input.length);
    input.forEach((c, i) => strings[i] = lookup.get(c));
    return strings;
  }

  static productCodeFromKey(key: string): string {
    const index: number = key.lastIndexOf('-');
    return key.substring(0, index);
  }
}



