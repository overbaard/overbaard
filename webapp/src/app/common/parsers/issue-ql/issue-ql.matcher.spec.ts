import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {List, Map, OrderedSet} from 'immutable';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {LinkedIssue} from '../../../model/board/data/issue/linked-issue';
import {IssueQlMatcher} from './issue-ql.matcher';
import {IssueQlAstParser} from './ast/ast-parser.iql';
import {IssueVisitor} from './issue.visitor';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';

describe('Issue QL Tests', () => {
  describe('Factor Expression Tests', () => {
    describe('Fully Populated Issue', () => {
      describe('Equals', () => {
        describe('Matching', () => {
          it('Assignee', () => {
            checkMatches('assignEE="kabir"', true);
          });
          it('Component', () => {
            checkMatches('Component    = "C1"', true);
          });
          it('Labels', () => {
            checkMatches('LabelS = "L2"', true);
          });
          it('FixVersion', () => {
            checkMatches('FixVersion = "F2"', true);
          });
          it('Priority', () => {
            checkMatches('PRIority = "high"', true);
          });
          it('Project', () => {
            checkMatches('ProJect = "ISSUE"', true);
          });
          it('Type', () => {
            checkMatches('TyPe = "bug"', true);
          });
        });
        describe('Not Matching', () => {
          it('Assignee', () => {
            checkMatches('assignEE="kabirX"', false);
          });
          it('Component', () => {
            checkMatches('Component = "C1X"', false);
          });
          it('Labels', () => {
            checkMatches('LabelS = "L2X"', false);
          });
          it('FixVersion', () => {
            checkMatches('FIXVersion = "F2X"', false);
          });
          it('Priority', () => {
            checkMatches('PRIority = "highX"', false);
          });
          it('Project', () => {
            checkMatches('ProJect = "ISSUEX"', false);
          });
          it('Type', () => {
            checkMatches('TyPe = "bugX"', false);
          });
        });
      });
      describe('Not Equals', () => {
        describe('Matching', () => {
          it('Assignee', () => {
            checkMatches('assignEE!="kabirX"', true);
          });
          it('Component', () => {
            checkMatches('Component != "C1X"', true);
          });
          it('Labels', () => {
            checkMatches('LabelS != "L2X"', true);
          });
          it('FixVersion', () => {
            checkMatches('FixVersion != "F2x"', true);
          });
          it('Priority', () => {
            checkMatches('PRIority != "highX"', true);
          });
          it('Project', () => {
            checkMatches('ProJect != "ISSUEX"', true);
          });
          it('Type', () => {
            checkMatches('TyPe != "bugX"', true);
          });
        });
        describe('Not Matching', () => {
          it('Assignee', () => {
            checkMatches('assignEE!="kabir"', false);
          });
          it('Component', () => {
            checkMatches('Component != "C1"', false);
          });
          it('Labels', () => {
            checkMatches('LabelS != "L2"', false);
          });
          it('FixVersion', () => {
            checkMatches('FIXVersion != "F2"', false);
          });
          it('Priority', () => {
            checkMatches('PRIority != "high"', false);
          });
          it('Project', () => {
            checkMatches('ProJect != "ISSUE"', false);
          });
          it('Type', () => {
            checkMatches('TyPe != "bug"', false);
          });
        });
      });
      describe('Empty Factor Expression', () => {
        describe('Empty', () => {
          describe('Matching', () => {
            it('Assignee', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.assignee = NO_ASSIGNEE;
              checkMatches('assignEE iS EMPTy', true, issue);
            });
            it('Component', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.components = OrderedSet<string>();
              checkMatches('Component  is empty', true, issue);
            });
            it('Labels', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.labels = OrderedSet<string>();
              checkMatches('LabelS is empty', true, issue);
            });
            it('Priority', () => {
              // This cannot be empty, don't test
            });
            it('Project', () => {
              // This cannot be empty, don't test
            });
            it('Type', () => {
              // This cannot be empty, don't test
            });
          });
          describe('Not Matching', () => {
            it('Assignee', () => {
              checkMatches('assignee is empty', false);
            });
            it('Component', () => {
              checkMatches('Component is empty', false);
            });
            it('Labels', () => {
              checkMatches('LabelS is empty', false);
            });
            it('Priority', () => {
              checkMatches('PRIority is empty', false);
            });
            it('Project', () => {
              checkMatches('ProJect  is empty', false);
            });
            it('Type', () => {
              checkMatches('Type is empty', false);
            });
          });
        });
        describe('Not Empty', () => {
          describe('Matching', () => {
            it('Assignee', () => {
              checkMatches('assignee is NOT empty', true);
            });
            it('Component', () => {
              checkMatches('Component is not empty', true);
            });
            it('Labels', () => {
              checkMatches('LabelS is not empty', true);
            });
            it('Priority', () => {
              checkMatches('PRIority is not empty', true);
            });
            it('Project', () => {
              checkMatches('ProJect is not empty', true);
            });
            it('Type', () => {
              checkMatches('Type is not empty', true);
            });
          });
          describe('Not Matching', () => {
            it('Assignee', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.assignee = NO_ASSIGNEE;
              checkMatches('assignee is not empty', false, issue);
            });
            it('Component', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.components = OrderedSet<string>();
              checkMatches('Component is not empty', false, issue);
            });
            it('Labels', () => {
              const issue: BoardIssueView = populatedIssue();
              issue.labels = OrderedSet<string>();
              checkMatches('Labels is not empty', false, issue);
            });
            it('Priority', () => {
              // This cannot be empty, don't test
            });
            it('Project', () => {
              // This cannot be empty, don't test
            });
            it('Type', () => {
              // This cannot be empty, don't test
            });
          });
        });
      });
      describe('And', () => {
        describe('Matching', () => {
          describe('One And', () => {
            it ('All Equals', () => {
              checkMatches('assignEE="kabir" and labels="L1"', true);
            });
            it ('All Equals With outer brackets', () => {
              checkMatches('(assignEE="kabir" AND labels="L1")', true);
            });
            it ('All Equals With inner brackets', () => {
              checkMatches('(assignEE="kabir") aNd (labels="L1")', true);
            });
            it ('All Equals With outer and inner brackets', () => {
              checkMatches('(assignEE="kabir" and (labels="L1"))', true);
            });
            it ('All Non-Equals', () => {
              checkMatches('assignee!="kabirX" and labels!="L1x"', true);
            });
            it ('Mixed Equals and Non-Equals', () => {
              checkMatches('assignee = "kabir" and labels != "L1x"', true);
            });
          });
          it('Several Ands', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and labels = "L2") and assignee is not empty', true);
          });
        });
        describe('Non-Matching', () => {
          describe('One And', () => {
            it ('All Equals', () => {
              checkMatches('assignee = "kabirX" and labels="L1X"', false);
            });
            it ('All Non-Equals', () => {
              checkMatches('assignee != "kabir" and labels != "L1"', false);
            });
            it ('Mixed Equals and Non-Equals (fail first)', () => {
              checkMatches('assignee = "kabirX" and labels != "L1x"', false);
            });
            it ('Mixed Equals and Non-Equals (fail second)', () => {
              checkMatches('assignee != "kabirX" and labels = "L1x"', false);
            });
          });
          it('Several Ands', () => {
            checkMatches('assignee = "kabir" and labels="L1" and labels = "L2"', true);
          });
        });
      });
      describe('Or', () => {
        it ('Match all', () => {
          checkMatches('assignee = "kabir" OR labels="L1" or labels = "L2" or labels is not empty', true);
        });
        it ('Match first', () => {
          checkMatches('assignee = "kabir" oR labels!="L1" Or labels != "L2"  or labels is empty', true);
        });
        it ('Match second', () => {
          checkMatches('assignee != "kabir" OR labels="L1" or labels != "L2"  or labels is empty', true);
        });
        it ('Match third', () => {
          checkMatches('assignee != "kabir" OR labels!="L1" or labels = "L2" or labels is empty', true);
        });
        it ('Match fourth', () => {
          checkMatches('assignee != "kabir" OR labels="L1" or labels = "L2" or labels is not empty', true);
        });
        it ('Match None', () => {
          checkMatches('assignee != "kabir" OR labels!="L1" or labels != "L2" or labels is empty', false);
        });
      });
      describe('Brackets', () => {
        describe('Matching', () => {
          it ('Simple', () => {
            checkMatches('(component="C1")', true);
          });
          it ('AND', () => {
            checkMatches('(component="C1" AND component="C2")', true);
          });
          it ('OR', () => {
            checkMatches('(component="C1x" OR component="C2")', true);
          });
        });
        describe('Not Matching', () => {
          it ('Simple', () => {
            checkMatches('(component="C3")', false);
          });
          it ('AND', () => {
            checkMatches('(component="C1" AND component="C2x")', false);
          });
          it ('OR', () => {
            checkMatches('(component="C1x" OR component="C2x")', false);
          });
        });
      });

      describe('Negation of Brackets', () => {
        describe('Simple', () => {
          describe('Equals', () => {
            it ('Matching', () => {
              checkMatches('!(component="C3")', true);
            });
            it ('Not Matching', () => {
              checkMatches('!(component="C2")', false);
            });
          });
          describe ('Not Equals', () => {
            it ('Matching', () => {
              checkMatches('!(labels != "L2")', true);
            });
            it ('Not Matching', () => {
              checkMatches('!(labels != "L3")', false);
            });
          });
        });
        describe('AND', () => {
          it ('Matching', () => {
            checkMatches('!(component="C1" AND component="C2x")', true);
          });
          it ('Not Matching', () => {
            checkMatches('!(component="C1" AND component="C2")', false);
          });
        });
        describe('OR', () => {
          it ('Matching', () => {
            checkMatches('!(component="C1x" OR component="C2x")', true);
          });
          it ('Not Matching', () => {
            checkMatches('!(component="C1x" OR component="C2")', false);
          });
        });
      });
      describe('IN', () => {
        it ('Matching', () => {
          checkMatches('component IN ("C1x", "C2")', true);
        });
        it ('Non-Matching', () => {
          checkMatches('component IN ("C1x", "C2x")', false);
        });
      });
      describe('NOT IN', () => {
        it ('Matching', () => {
          checkMatches('component NOT IN ("C1x", "C2x")', true);
        });
        it ('Non-Matching', () => {
          checkMatches('component NOT IN ("C1x", "C2")', false);
        });
      });
      describe('Complex Tests', () => {
        describe('Matching', () => {
          it('No Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and (component="C1x" OR component="C2"))', true);
          });
          it('AND Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and !(component="C1" AND component="C2x"))', true);
          });
          it('AND Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and !(component="C1x" OR component="C2x"))', true);
          });
        });
        describe('Non-Matching', () => {
          it('No Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and (component="C1x" OR component="C2x"))', false);
          });
          it('AND Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and !(component="C1" AND component="C2"))', false);
          });
          it('OR Negation', () => {
            checkMatches('assignee = "kabir" and (labels="L1" and !(component="C1" OR component="C2x"))', false);
          });
        });
      });
    });
  });

  describe('Minimal Issue Tests', () => {

    /**
     * Here we test that the matcher still works when the nillable fields are null.
     * Only fields that are nillable are tested here
     */
    describe('Equals', () => {
      // I don't think we need to do matching here, as it cannot match
      describe('Not Matching', () => {
        it('Component', () => {
          checkMatches('Component = "C1"', false, minimalIssue());
        });
        it('Labels', () => {
          checkMatches('LabelS = "L2"', false, minimalIssue());
        });
        it('FixVersion', () => {
          checkMatches('FIXVersion = "F2"', false, minimalIssue());
        });
      });
    });
    describe('Not Equals', () => {
      // I don't think we need to do not-matching here, as it cannot match
      describe('Matching', () => {
        it('Component', () => {
          checkMatches('Component != "C1"', true, minimalIssue());
        });
        it('Labels', () => {
          checkMatches('LabelS != "L2"', true, minimalIssue());
        });
        it('FixVersion', () => {
          checkMatches('FixVersion != "F2"', true, minimalIssue());
        });
      });
    });
    describe('IN', () => {
      // I don't think we need to do matching here, as it cannot match
      describe('Non-Matching', () => {
        it('Component', () => {
          checkMatches('Component IN("C1")', false, minimalIssue());
        });
        it('Labels', () => {
          checkMatches('Labels  IN("L1")', false, minimalIssue());
        });
        it('FixVersion', () => {
          checkMatches('FIXVersion  IN("F1")', false, minimalIssue());
        });
      });
    });
    describe('NOT IN', () => {
      describe('Matching', () => {
        it('Component', () => {
          checkMatches('Component NOT IN("C1")', true, minimalIssue());
        });
        it('Labels', () => {
          checkMatches('Labels NOT IN("L1")', true, minimalIssue());
        });
        it('FixVersion', () => {
          checkMatches('FIXVersion NOT IN("F1")', true, minimalIssue());
        });
      });
    });
    describe('IS EMPTY', () => {
      describe('Matching', () => {
        it('Component', () => {
          checkMatches('Component IS EMPTY', true, minimalIssue());
        });
        it('Labels', () => {
          checkMatches('Labels IS EMPTY', true, minimalIssue());
        });
        it('FixVersion', () => {
          checkMatches('FIXVersion IS EMPTY', true, minimalIssue());
        });
      });
    });
  });
});

function checkMatches(issueQl: string, match: boolean, issue?: BoardIssueView) {
  const matcher = new IssueQlMatcher(new IssueQlAstParser().createAstStructure(issueQl));
  const boardIssue = issue ? issue : populatedIssue();
  expect(matcher.matchIssue(new IssueVisitor(boardIssue))).toBe(match);
}

function populatedIssue(): BoardIssueView {
  return {
    key: 'ISSUE-1',
    projectCode: 'ISSUE',
    priority: {name: 'high', colour: null},
    type: {name: 'bug', colour: null},
    summary: 'Hello this is an issue',
    assignee: {key: 'kabir', name: 'Kabir Khan', avatar: '', email: '', initials: 'KK'},
    components: OrderedSet<string>(['C1', 'C2']),
    labels: OrderedSet<string>(['L1', 'L2']),
    fixVersions: OrderedSet<string>(['F1', 'F2']),
    customFields: Map<string, CustomField>(),
    parallelTasks: null,
    selectedParallelTasks: null,
    linkedIssues: List<LinkedIssue>(),
    ownState: -1,
    projectColour: 'red',
    visible: true,
    matchesSearch: true,
    issueUrl: null,
    ownStateName: null,
    calculatedTotalHeight: 0,
    summaryLines: List<string>()
  };
}


function minimalIssue(): BoardIssueView {
  return {
    key: 'ISSUE-1',
    projectCode: 'ISSUE',
    priority: {name: 'high', colour: null},
    type: {name: 'bug', colour: null},
    summary: 'Hello this is an issue',
    assignee: NO_ASSIGNEE,
    components: null,
    labels: null,
    fixVersions: null,
    customFields: Map<string, CustomField>(),
    parallelTasks: null,
    selectedParallelTasks: null,
    linkedIssues: List<LinkedIssue>(),
    ownState: -1,
    projectColour: 'red',
    visible: true,
    matchesSearch: true,
    issueUrl: null,
    ownStateName: null,
    calculatedTotalHeight: 0,
    summaryLines: List<string>()
  };
}
