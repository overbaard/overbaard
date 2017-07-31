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
          email : 'UserA@examle.com',
          avatar : 'https://example.com/user-A.png',
          name : 'User A'
        }));
      assignees.push(AssigneeFactory.fromJS(
        {
          key : 'userB',
          email : 'UserB@examle.com',
          avatar : 'https://example.com/user-B.png',
          name : 'User B'
        }));
    });

    it('Full record', () => {
      const issue: BoardIssue = IssueFactory.fromJS(input, assignees);
      expect(issue.key).toEqual('ISSUE-1');
      expect(issue.summary).toEqual('Issue summary');
      expect(issue.assignee).toBe(assignees[0]);

      expect(issue.linkedIssues).toBeTruthy();
      expect(issue.linkedIssues.size).toEqual(2);
      expect(issue.linkedIssues.get(0).key).toEqual('LNK-1');
      expect(issue.linkedIssues.get(0).summary).toEqual('Linked 1');
      expect(issue.linkedIssues.get(1).key).toEqual('LNK-2');
      expect(issue.linkedIssues.get(1).summary).toEqual('Linked 2');
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
    })


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


