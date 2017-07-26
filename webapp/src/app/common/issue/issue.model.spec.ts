import {BoardIssue, IssueFactory} from './issue.model';

describe('Issue unit tests', () => {

  describe('Deserialize', () => {
    const input: any = {
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


    it('Full record', () => {
      const issue: BoardIssue = IssueFactory.fromJS(input);
      console.log('read record');
      expect(issue.key).toEqual('ISSUE-1');
      expect(issue.summary).toEqual('Issue summary');
      // TODO assignee from registry

      expect(issue.linkedIssues).toBeTruthy();
      expect(issue.linkedIssues.size).toEqual(2);
      expect(issue.linkedIssues.get(0).key).toEqual('LNK-1');
      expect(issue.linkedIssues.get(0).summary).toEqual('Linked 1');
      expect(issue.linkedIssues.get(1).key).toEqual('LNK-2');
      expect(issue.linkedIssues.get(1).summary).toEqual('Linked 2');
    });



  });
});


