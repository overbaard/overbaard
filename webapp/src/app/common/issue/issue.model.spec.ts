import {BoardIssue, Issue, IssueFactory} from './issue.model';
import {Assignee, AssigneeFactory, NO_ASSIGNEE} from '../assignee/assignee.model';

describe('Issue unit tests', () => {

  describe('Deserialize', () => {
    let input: any;
    let assignees: Assignee[];

    beforeEach(() => {
      input = {
        key: 'ISSUE-1',
        summary: 'Issue summary',
        assignee: 0,
        'linked-issues' : [
          {
            key : 'LNK-1',
            summary : 'Linked 1',
          },
          {
            key : 'LNK-2',
            summary : 'Linked 2',
          }]
      };

      assignees = [];
      assignees.push(AssigneeFactory.fromJS(
        {
          key : 'userA',
          email : 'userA@examle.com',
          avatar : 'https://example.com/userA.png',
          name : 'UserA Smith'
        }));
      assignees.push(AssigneeFactory.fromJS(
        {
          key : 'userB',
          email : 'userB@examle.com',
          avatar : 'https://example.com/userB.png',
          name : 'userB Jones'
        }));
    });

    it('Full record', () => {
      const issue: BoardIssue = IssueFactory.fromJS(input, assignees);
      new IssueChecker(issue, assignees[0], 'Issue summary')
        .key('ISSUE-1')
        .addLinkedIssue('LNK-1', 'Linked 1')
        .addLinkedIssue('LNK-2', 'Linked 2')
        .check();
    });

    it('Assignee > 0', () => {
      input['assignee'] = 1;
      const issue: BoardIssue = IssueFactory.fromJS(input, assignees);
      expect(issue.assignee).toBe(assignees[1]);
    });

    it ('No assignee', () => {
      delete input['assignee'];
      const issue: BoardIssue = IssueFactory.fromJS(input, assignees);
      expect(issue.assignee).toBe(NO_ASSIGNEE);
    });


    it('No linked issues', () => {
      delete input['linked-issues'];
      const issue: BoardIssue = IssueFactory.fromJS(input, assignees);
      console.log('read record');
      expect(issue.key).toEqual('ISSUE-1');
      expect(issue.summary).toEqual('Issue summary');
      // TODO assignee from registry

      expect(issue.linkedIssues).toBeTruthy();
      expect(issue.linkedIssues.size).toEqual(0);
    });

  });
});

class IssueChecker {
  private _issue: BoardIssue;
  private _key: string;
  // private _type: string;
  // private _priority: string;
  private _assignee: string | Assignee;
  private _summary: string;
  private _linkedIssues: LinkedIssueChecker[];
  // private _components: string[];
  // private _labels: string[];
  // private _fixVersions: string[];
  // private _customFields: IMap<CustomFieldValue>;
  // private _selectedParallelTaskOptions:string[]



  constructor(issue: BoardIssue/*, type: string, priority: string*/, assignee: string | Assignee, summary: string) {
    this._issue = issue;
    this._key = issue.key;
    // this._type = type;
    // this._priority = priority;
    this._assignee = assignee;
    this._summary = summary;
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
  /*
  components(...components:string[]) : IssueChecker {
    this._components = components;
    return this;
  }

  labels(...labels:string[]) : IssueChecker {
    this._labels = labels;
    return this;
  }

  fixVersions(...fixVersions:string[]) : IssueChecker {
    this._fixVersions = fixVersions;
    return this;
  }

  customField(field:string, key:string, displayValue:string) : IssueChecker {
    if (!this._customFields) {
      this._customFields = {};
    }
    this._customFields[field] = new CustomFieldValue(key, displayValue);
    return this;
  }

  selectedParallelTaskOptions(...selectedOptions:string[]) : IssueChecker {
    this._selectedParallelTaskOptions = selectedOptions;
    return this;
  }
  */
  check() {
    expect(this._issue.key).toEqual(this._key);
    // DataChecker.checkIssueType(this._issue.type, this._type);
    // DataChecker.checkPriority(this._issue.priority, this._priority);
    if (this._assignee) {
      if (typeof this._assignee === 'string') {
        DataChecker.checkAssignee(this._issue.assignee, <string>this._assignee);
      } else {
        expect(this._issue.assignee).toBe(this._assignee);
      }
    } else {
      expect(this._issue.assignee).not.toEqual(jasmine.anything());
    }

    /*
    if (this._components) {
      this.checkMultiSelectFieldValues(this._issue.components.array, this._components);

    } else {
      expect(this._issue.components).not.toEqual(jasmine.anything());
    }

    if (this._labels) {
      this.checkMultiSelectFieldValues(this._issue.labels.array, this._labels);
    } else {
      expect(this._issue.labels).not.toEqual(jasmine.anything());
    }

    if (this._fixVersions) {
      this.checkMultiSelectFieldValues(this._issue.fixVersions.array, this._fixVersions);
    } else {
      expect(this._issue.fixVersions).not.toEqual(jasmine.anything(), this._issue.key);
    }*/

    if (this._summary) {
      expect(this._issue.summary).toEqual(this._summary);
    }

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
    /*
    if (this._customFields) {
      let issueFieldNames:string[] = this._issue.customFieldNames;
      let expectedFieldNames:string[] = IMapUtil.getSortedKeys(this._customFields);
      expect(expectedFieldNames).toEqual(issueFieldNames);

      for (let fieldName of issueFieldNames) {
        let customField:CustomFieldValue = this._issue.getCustomFieldValue(fieldName);
        let expectedField:CustomFieldValue = this._customFields[fieldName];
        expect(customField).toEqual(jasmine.anything());
        expect(customField.key).toEqual(expectedField.key);
        expect(customField.displayValue).toEqual(expectedField.displayValue);
      }
    } else {
      expect(this._issue.customFieldNames).toEqual(jasmine.anything());
    }

    if (this._selectedParallelTaskOptions) {
      let options:Indexed<string> = this._issue.parallelTaskOptions;
      expect(options).toEqual(jasmine.anything());
      expect(options.array.length).toEqual(this._selectedParallelTaskOptions.length);
      for (let i = 0 ; i < this._selectedParallelTaskOptions.length ; i++) {
        expect(options.array[i]).toEqual(this._selectedParallelTaskOptions[i]);
      }
    } else {
      expect(this._selectedParallelTaskOptions).not.toEqual(jasmine.anything());
    }
    */

    // checkIssueConvenienceMethods(this._issue);
  }

  /*
  private checkMultiSelectFieldValues(issueValues:JiraMultiSelectFieldValue[], keys:string[]) {
    expect(issueValues).toEqual(jasmine.anything());
    expect(issueValues.length).toEqual(keys.length);
    for (let i:number = 0 ; i < keys.length ; i++) {
      expect(keys).toContain(issueValues[i].name);
    }
  }
  */
}

class DataChecker {
  static checkAssignee(assignee: Assignee, key: string) {
    expect(assignee.key).toEqual(key);
    expect(assignee.avatar).toEqual('https://example.com/' + key + '.png');
    expect(assignee.email).toEqual(key + '@example.com');
    expect(assignee.name.toLowerCase()).toContain(key.toLowerCase());
  }

/*  static checkPriority(priority:Priority, name:string) {
    expect(priority.name).toEqual(name);
    expect(priority.icon).toEqual("/icons/priorities/" + name + ".png");
  }

  static checkIssueType(type:IssueType, name:string) {
    expect(type.name).toEqual(name);
    expect(type.icon).toEqual("/icons/issue-types/" + name + ".png");
  }*/
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

