import {Priority, PriorityUtil} from './priority.model';
import {cloneObject} from '../../../../common/object-util';

describe('Priority unit tests', () => {

  describe('Deserialize', () => {
    const input: any = cloneObject({
      name : 'Blocker',
      colour : 'red'
    });

    it('Deserialize', () => {
      // Check the full record here. Other tests will check the initials calculated
      const priority: Priority = PriorityUtil.fromJS(input);
      expect(priority).toEqual(jasmine.anything());
      expect(priority.name).toEqual('Blocker');
      expect(priority.colour).toEqual('red');
    });
  });
});
