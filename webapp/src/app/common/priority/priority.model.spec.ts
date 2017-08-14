import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import * as Immutable from 'immutable';
import {Priority, PriorityFactory} from './priority.model';

describe('Priority unit tests', () => {

  describe('Deserialize', () => {
    const input: any = {
      name : 'Blocker',
      icon : 'https://example.com/blocker.png'
    };

    it('Deserialize', () => {
      // Check the full record here. Other tests will check the initials calculated
      const priority: Priority = PriorityFactory.fromJS(input);
      expect(priority).toEqual(jasmine.anything());
      expect(priority.name).toEqual('Blocker');
      expect(priority.icon).toEqual('https://example.com/blocker.png');
    });
  });
});
