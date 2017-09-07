import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, AssigneeState, NO_ASSIGNEE} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {fromJS, List, Map, OrderedMap} from 'immutable';
import {CustomField} from '../custom-field/custom-field.model';
import {ParallelTask} from '../project/project.model';

export interface IssueState {
  issues: Map<string, BoardIssue>;
}


export interface Issue {
  key: string;
  summary: string;
}

export interface BoardIssue extends Issue {
  assignee: Assignee;
  priority: Priority;
  type: IssueType;
  components: List<string>;
  labels: List<string>;
  fixVersions: List<string>;
  customFields: Map<string, CustomField>;
  parallelTasks: List<string>;
  linkedIssues: List<Issue>;
}

const DEFAULT_STATE: IssueState = {
  issues: Map<string, BoardIssue>()
};

const DEFAULT_ISSUE: BoardIssue = {
  key: null,
  summary: null,
  assignee: null,
  priority: null,
  type: null,
  components: null,
  labels: null,
  fixVersions: null,
  customFields: null,
  parallelTasks: null,
  linkedIssues: List<Issue>()
};

const DEFAULT_LINKED_ISSUE: Issue = {
  key: null,
  summary: null
};

interface BoardIssueRecord extends TypedRecord<BoardIssueRecord>, BoardIssue {
}

interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, Issue {
}

interface IssueStateRecord extends TypedRecord<IssueStateRecord>, IssueState {
}

const ISSUE_FACTORY = makeTypedFactory<BoardIssue, BoardIssueRecord>(DEFAULT_ISSUE);
const LINKED_ISSUE_FACTORY = makeTypedFactory<Issue, LinkedIssueRecord>(DEFAULT_LINKED_ISSUE);
const STATE_FACTORY = makeTypedFactory<IssueState, IssueStateRecord>(DEFAULT_STATE);
export const initialIssueState: IssueState = STATE_FACTORY(DEFAULT_STATE);

/**
 * Convenience class to make it easier to pass in other data needed to deserialize an issue. Especially from unit tests,
 * where we do this repeatedly.
 */
export class DeserializeIssueLookupParams {
  private _assignees: List<Assignee> = List<Assignee>();
  private _issueTypes: List<IssueType> = List<IssueType>();
  private _priorities: List<Priority> = List<Priority>();
  private _components: List<string> = List<string>();
  private _labels: List<string> = List<string>();
  private _fixVersions: List<string> = List<string>();
  private _customFields: OrderedMap<string, List<CustomField>> = OrderedMap<string, List<CustomField>>();
  private _parallelTasks: Map<string, List<ParallelTask>> = Map<string, List<ParallelTask>>();

  setAssignees(value: List<Assignee>): DeserializeIssueLookupParams {
    this._assignees = value;
    return this;
  }

  setIssueTypes(value: List<IssueType>): DeserializeIssueLookupParams {
    this._issueTypes = value;
    return this;
  }

  setPriorities(value: List<Priority>): DeserializeIssueLookupParams {
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

  setCustomFields(value: OrderedMap<string, List<CustomField>>): DeserializeIssueLookupParams {
    this._customFields = value;
    return this;
  }

  setParallelTasks(value: Map<string, List<ParallelTask>>): DeserializeIssueLookupParams {
    this._parallelTasks = value;
    return this;
  }

  get assignees(): List<Assignee> {
    return this._assignees;
  }

  get issueTypes(): List<IssueType> {
    return this._issueTypes;
  }

  get priorities(): List<Priority> {
    return this._priorities;
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

  get customFields(): OrderedMap<string, List<CustomField>> {
    return this._customFields;
  }

  get parallelTasks(): Map<string, List<ParallelTask>> {
    return this._parallelTasks;
  }
}

export class IssueUtil {

  static fromJS(input: any, params: DeserializeIssueLookupParams): BoardIssue {
    const projectKey: string = IssueUtil.productCodeFromKey(input['key']);

    // Rework the data as needed before deserializing
    if (input['linked-issues']) {
      input['linkedIssues'] = input['linked-issues'];
    }
    delete input['linked-issues'];

    if (input['assignee'] || input['assignee'] === 0) {
      input['assignee'] = params.assignees.get(input['assignee']);
    } else {
      input['assignee'] = NO_ASSIGNEE;
    }

    // priority and issue-type will never be null
    input['priority'] = params.priorities.get(input['priority']);
    input['type'] = params.issueTypes.get(input['type']);

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
      for (const key of Object.keys(custom)) {
        custom[key] = params.customFields.get(key).get(custom[key]);
      }
      input['customFields'] = custom;
      delete input['custom'];
    } else {
      input['customFields'] = Map<string, CustomField>();
    }

    if (input['parallel-tasks']) {
      const ptList: List<ParallelTask> = params.parallelTasks.get(projectKey);
      const parallelTasksInput: any[] = input['parallel-tasks'];
      for (let i = 0 ; i < parallelTasksInput.length ; i++) {
        const parallelTask: ParallelTask = ptList.get(i);
        parallelTasksInput[i] = parallelTask.options.get(parallelTasksInput[i]);
      }
      input['parallelTasks'] = List<string>(parallelTasksInput);
      delete input['parallel-tasks'];
    }

    const temp: any = fromJS(input, (key, value) => {
      if (key === 'linkedIssues') {
        const tmp: List<any> = value.toList();
        return tmp.withMutations(mutable => {
          tmp.forEach((li, i) => {
            mutable.set(i, LINKED_ISSUE_FACTORY(<any>li));
          });
        });
      }
      return value;
    });
    return ISSUE_FACTORY(temp);
  }

  static toStateRecord(s: IssueState): IssueStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <IssueStateRecord>s;
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
};


