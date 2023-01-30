import {Assignee, AssigneeUtil} from './assignee.model';
import {cloneObject} from '../../../../common/object-util';

describe('Assignee unit tests', () => {

  describe('Deserialize', () => {
    let input: any;
    beforeEach(() => {
      input = cloneObject({
            key : 'userA',
            email : 'UserA@example.com',
            avatar : 'https://example.com/user-A.png',
            name : 'User A'
          });
    })

    it('full record', () => {
      // Check the full record here. Other tests will check the initials calculated
      const assignee: Assignee = AssigneeUtil.fromJS(input);
      expect(assignee).toEqual(jasmine.anything());
      expect(assignee.key).toEqual('userA');
      expect(assignee.email).toEqual('UserA@example.com');
      expect(assignee.avatar).toEqual('https://example.com/user-A.png');
      expect(assignee.name).toEqual('User A');
      expect(assignee.initials).toEqual('UA');
    });

    describe('initials', () => {
      it('4 word name', () => {
        input['name'] = 'Kabir Middle Khan Ignored';
        const assignee: Assignee = AssigneeUtil.fromJS(input);
        expect(assignee.initials).toEqual('KMK');
      });

      it('3 word name', () => {
        input['name'] = 'Kabir Middle Khan';
        const assignee: Assignee = AssigneeUtil.fromJS(input);
        expect(assignee.initials).toEqual('KMK');
      });

      it('2 word name', () => {
        input['name'] = 'Kabir Khan';
        const assignee: Assignee = AssigneeUtil.fromJS(input);
        expect(assignee.initials).toEqual('KK');
      });

      it ('1 word name - lower case', () => {
        input['name'] = 'admin';
        const assignee: Assignee = AssigneeUtil.fromJS(input);
        expect(assignee.initials).toEqual('Adm');
      });

      it ('1 word name - upper case', () => {
        input['name'] = 'ADMIN';
        const assignee: Assignee = AssigneeUtil.fromJS(input);
        expect(assignee.initials).toEqual('Adm');
      });
    });
  });
});


