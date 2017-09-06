import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
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
  customFields: Map<string, CustomFieldValue>;
  parallelTasks: List<string>;
  linkedIssues: List<Issue>;
}

export interface CustomFieldValue {
  key: string;
  value: string;
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

const DEFAULT_CUSTOM_FIELD_VALUE: CustomFieldValue = {
  key: null,
  value: null
};


interface BoardIssueRecord extends TypedRecord<BoardIssueRecord>, BoardIssue {
}

interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, Issue {
}

interface IssueStateRecord extends TypedRecord<IssueStateRecord>, IssueState {
}

interface CustomFieldValueRecord extends TypedRecord<CustomFieldValueRecord>, CustomFieldValue {
}

const ISSUE_FACTORY = makeTypedFactory<BoardIssue, BoardIssueRecord>(DEFAULT_ISSUE);
const LINKED_ISSUE_FACTORY = makeTypedFactory<Issue, LinkedIssueRecord>(DEFAULT_LINKED_ISSUE);
const STATE_FACTORY = makeTypedFactory<IssueState, IssueStateRecord>(DEFAULT_STATE);
const CUSTOM_FIELD_FACTORY = makeTypedFactory<CustomFieldValue, CustomFieldValueRecord>(DEFAULT_CUSTOM_FIELD_VALUE);
export const initialIssueState: IssueState = STATE_FACTORY(DEFAULT_STATE);


export class IssueUtil {

  static fromJS(input: any, assignees: Assignee[], priorities: Priority[], issueTypes: IssueType[],
                components: List<string>, labels: List<string>, fixVersions: List<string>,
                customFields: OrderedMap<string, List<CustomField>>,
                parallelTasks: Map<string, List<ParallelTask>>): BoardIssue {
    const projectKey: string = IssueUtil.productCodeFromKey(input['key']);

    // Rework the data as needed before deserializing
    if (input['linked-issues']) {
      input['linkedIssues'] = input['linked-issues'];
    }
    delete input['linked-issues'];

    if (input['assignee'] || input['assignee'] === 0) {
      input['assignee'] = assignees[input['assignee']];
    } else {
      input['assignee'] = NO_ASSIGNEE;
    }

    // priority and issue-type will never be null
    input['priority'] = priorities[input['priority']];
    input['type'] = issueTypes[input['type']];

    if (input['components']) {
      input['components'] = IssueUtil.lookupStringsFromIndexArray(input['components'], components);
    }
    if (input['labels']) {
      input['labels'] = IssueUtil.lookupStringsFromIndexArray(input['labels'], labels);
    }
    if (input['fix-versions']) {
      input['fixVersions'] = IssueUtil.lookupStringsFromIndexArray(input['fix-versions'], fixVersions);
      delete input['fix-versions'];
    }
    if (input['custom']) {
      const custom = input['custom'];
      for (const key of Object.keys(custom)) {
        custom[key] = customFields.get(key).get(custom[key]);
      }
      input['customFields'] = custom;
      delete input['custom'];
    } else {
      input['customFields'] = Map<string, CustomFieldValue>();
    }

    if (input['parallel-tasks']) {
      const ptList: List<ParallelTask> = parallelTasks.get(projectKey);
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
