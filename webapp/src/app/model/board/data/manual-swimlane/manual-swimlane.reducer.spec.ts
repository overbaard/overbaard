import {OrderedMap} from 'immutable';
import {cloneObject} from '../../../../common/object-util';
import {initialManualSwimlaneState, ManualSwimlane, ManualSwimlaneEntry, ManualSwimlaneState} from './manual-swimlane.model';
import {ManualSwimlanesActions, manualSwimlaneReducer} from './manual-swimlane.reducer';
import {IssueQlUtil} from '../../../../common/parsers/issue-ql/issue-ql.util';
import {IssueQlNode} from '../../../../common/parsers/issue-ql/ast/node.iql';

export function getTestManualSwimlanesInput() {
  return cloneObject([
    {
      name: 'Manual-Swimlane',
      entries : [
        {
          name: 'One Lane',
          'issue-ql': 'labels="L-10"'
        },
        {
          name: 'Another Lane',
          'issue-ql': 'component="C-30"'
        }
      ]
    }
  ]);
}

export function getTestManualSwimlanesState() {
  const input: any = getTestManualSwimlanesInput();
  return manualSwimlaneReducer(initialManualSwimlaneState, ManualSwimlanesActions.createDeserializeManualSwimlanes(input));
}

function getInternalTestManualSwimlanesInput() {
  return cloneObject([
    {
      name: 'First',
      entries : [
        {
          name: 'First-Lane1',
          'issue-ql': 'labels="L-10"'
        },
        {
          name: 'First-Lane2',
          'issue-ql': 'component="C-10"'
        },
        {
          name: 'First-Lane3',
          'issue-ql': 'labels="L-20"'
        }
      ]
    },
    {
      name: 'Second',
      entries : [
        {
          name: 'Second-Lane1',
          'issue-ql': 'component="C-20"'
        },
        {
          name: 'Second-Lane2',
          'issue-ql': 'labels="L-30"'
        }
      ]
    }
  ]);
}

function getInternalManualSwimlanesState(): ManualSwimlaneState {
  const input: any = getInternalTestManualSwimlanesInput();
  return manualSwimlaneReducer(initialManualSwimlaneState, ManualSwimlanesActions.createDeserializeManualSwimlanes(input));
}

describe('Manual Swimlane Reducer Tests', () => {
  describe('Deserialize', () => {
    it('Deserialize initial state', () => {
      const state: ManualSwimlaneState = getInternalManualSwimlanesState();
      const map: OrderedMap<string, ManualSwimlane> = state.swimlanes;
      expect(map.size).toBe(2);

      const ms1: ManualSwimlane = map.get('First');
      expect(ms1.name).toBe('First');
      expect(ms1.swimlaneEntries.size).toBe(3);
      checkEntry(ms1.swimlaneEntries, 'First-Lane1', 'labels="L-10"');
      checkEntry(ms1.swimlaneEntries, 'First-Lane2', 'component="C-10"');
      checkEntry(ms1.swimlaneEntries, 'First-Lane3', 'labels="L-20"');

      const ms2: ManualSwimlane = map.get('Second');
      expect(ms2.name).toBe('Second');
      expect(ms2.swimlaneEntries.size).toBe(2);
      checkEntry(ms2.swimlaneEntries, 'Second-Lane1', 'component="C-20"');
      checkEntry(ms2.swimlaneEntries, 'Second-Lane2', 'labels="L-30"');
    });

    function checkEntry(map: OrderedMap<string, ManualSwimlaneEntry>, name: string, issueQl: string) {
      const entry: ManualSwimlaneEntry = map.get(name);
      expect(entry.name).toBe(name);
      expect(entry.issueQl).toBe(issueQl);
      expect(entry.parsedIssueQl).toBeTruthy();
      const parsed: IssueQlNode = IssueQlUtil.createIssueQlNode(issueQl);
      expect(entry.parsedIssueQl).toEqual(parsed);
    }

    describe('Equality Tests', () => {
      it ('Same state', () => {
        const stateA: ManualSwimlaneState = getInternalManualSwimlanesState();
        const stateB: ManualSwimlaneState =
          manualSwimlaneReducer(stateA, ManualSwimlanesActions.createDeserializeManualSwimlanes(getInternalTestManualSwimlanesInput()));
        expect(stateA).toBe(stateB);
      });

      it ('Different swimlane name', () => {
        doTest(input => input[0]['name'] = 'Firstx');
      });

      it ('Different swimlanes', () => {
        doTest(input => input.pop());
      });
      it ('Different swimlane entry name', () => {
        doTest(input => input[1]['entries'][1]['name'] = 'XXX');
      });
      it ('Different swimlane entries', () => {
        doTest(input => input[1]['entries'].pop());
      });
      it ('Different swimlane iql', () => {
        doTest(input => input[1]['entries'][1]['issue-ql'] = 'labels="L-99999"');
      });

      function doTest(adjuster: (input: any) => void) {
        const stateA: ManualSwimlaneState = getInternalManualSwimlanesState();
        const input: any = getInternalTestManualSwimlanesInput();
        adjuster(input);
        const stateB: ManualSwimlaneState =
          manualSwimlaneReducer(stateA, ManualSwimlanesActions.createDeserializeManualSwimlanes(input));
        expect(stateA).not.toBe(stateB);
      }
    });

    it ('Bad Issue QL', () => {
      // The idea here is that if something goes wrong in parsing the Issue QL for a ManualSwimlaneEntry that that ManualSwimlane does
      // not show up. Other manual swimlanes should be unaffected
      const input: any = getInternalTestManualSwimlanesInput();
      input[0]['entries'][1]['issue-ql'] = 'THIS IS ALL WRONG!!!!';
      const state: ManualSwimlaneState =
        manualSwimlaneReducer(initialManualSwimlaneState, ManualSwimlanesActions.createDeserializeManualSwimlanes(input));

      const map: OrderedMap<string, ManualSwimlane> = state.swimlanes;
      expect(map.size).toBe(1);

      const ms: ManualSwimlane = map.get('Second');
      expect(ms.name).toBe('Second');
      expect(ms.swimlaneEntries.size).toBe(2);
      checkEntry(ms.swimlaneEntries, 'Second-Lane1', 'component="C-20"');
      checkEntry(ms.swimlaneEntries, 'Second-Lane2', 'labels="L-30"');
    });
  });
});
