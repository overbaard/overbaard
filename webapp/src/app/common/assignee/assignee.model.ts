import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface AssigneeRecord extends TypedRecord<AssigneeRecord>, Assignee {}  {}

export interface Assignee {
  key: string;
  email: string;
  avatar: string;
  name: string;
  initials: string;
}

const DEFAULT: Assignee = {
  key: null,
  email: null,
  avatar: null,
  name: null,
  initials: null
};

/*
 make the factory to enable the generation of animal records
 */
const TYPED_FACTORY = makeTypedFactory<Assignee, AssigneeRecord>(DEFAULT);

export const NO_ASSIGNEE: Assignee = TYPED_FACTORY({
  key: '_____N$O$N$E____',
  email: '-',
  avatar: null,
  name: 'None',
  initials: '-'
});

export class AssigneeFactory {

  static fromJS(input: any): AssigneeRecord {
    input['initials'] = AssigneeFactory.calculateInitials(input['name']);
    return TYPED_FACTORY(input);
  }

  private static calculateInitials(name: string): string {

    const arr: string[] = name.split(' ');
    if (arr.length === 1) {
      let ret = '';
      for (let i = 0; i < 3 && i < arr[0].length; i++) {
        let char: string = arr[0][i];
        if (i === 0) {
          char = char.toUpperCase();
        } else {
          char = char.toLowerCase();
        }
        ret = ret + char;
      }
      return ret;
    }
    let ret = '';
    for (let i = 0; i < 3 && i < arr.length; i++) {
      ret = ret + arr[i][0];
    }
    return ret.toUpperCase();
  }
};

export class AssigneeUpdater {
  static update(assignee: Assignee, updater: (updated: Assignee) => void) {
    return (<AssigneeRecord>assignee).withMutations(updater);
  }
}


