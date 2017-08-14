
import {IssueType, IssueTypeFactory} from './issue-type.model';

describe('Issue Type unit tests', () => {

  describe('Deserialize', () => {
    const input: any = {
      name : 'Task',
      icon : 'https://example.com/task.png'
    };

    it('Deserialize', () => {
      // Check the full record here. Other tests will check the initials calculated
      const issueType: IssueType = IssueTypeFactory.fromJS(input);
      expect(issueType).toEqual(jasmine.anything());
      expect(issueType.name).toEqual('Task');
      expect(issueType.icon).toEqual('https://example.com/task.png');
    });
  });
});
