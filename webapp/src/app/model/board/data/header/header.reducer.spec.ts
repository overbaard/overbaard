import {HeaderActions, headerMetaReducer} from './header.reducer';
import {initialHeaderState} from './header.model';
import {HeaderState} from './header.state';

describe('Header reducer tests', () => {

  describe('Headers only', () => {
    it('Simple header', () => {
      const states = [
        {name: 'S1'},
        {name: 'S2'},
        {name: 'S3'}
      ];

      const headerState: HeaderState = headerMetaReducer(
        initialHeaderState,
        HeaderActions.createDeserializeHeaders(states, [], 0, 0));
      expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
      expect(headerState.backlog).toEqual(0);
      expect(headerState.categories.toArray()).toEqual([]);
      expect(headerState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
      expect(headerState.wip.toArray()).toEqual([0, 0, 0]);
      expect(headerState.helpTexts.size).toBe(0);
    });

    it('Full header', () => {
      const states = [
        {name: 'B1'},
        {name: 'B2'},
        {name: 'S1', header: 0, wip: 3},
        {name: 'S2', header: 0, wip: 4},
        {name: 'S3', header: 1},
        {name: 'S4', header: 1},
        {name: 'S5'}
      ];

      const headerState: HeaderState = headerMetaReducer(
        initialHeaderState,
        HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));
      expect(headerState.states.toArray()).toEqual(['B1', 'B2', 'S1', 'S2', 'S3', 'S4']);
      expect(headerState.backlog).toEqual(2);
      expect(headerState.categories.toArray()).toEqual(['H1', 'H2']);
      expect(headerState.stateToCategoryMappings.toArray()).toEqual([0, 0, 1, 1]);
      expect(headerState.wip.toArray()).toEqual([3, 4, 0, 0]);
      expect(headerState.helpTexts.size).toBe(0);
    });


    it('Same for same data', () => {
      const states = [
        {name: 'B1'},
        {name: 'B2'},
        {name: 'S1', header: 0, wip: 3},
        {name: 'S2', header: 0, wip: 4},
        {name: 'S3', header: 1},
        {name: 'S4', header: 1},
        {name: 'S5'}
      ];

      const headerState: HeaderState = headerMetaReducer(
        initialHeaderState,
        HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));

      const headerStateB: HeaderState = headerMetaReducer(
        headerState,
        HeaderActions.createDeserializeHeaders(states, ['H1', 'H2'], 2, 1));

      expect(headerStateB).toBe(headerState);
    });
  });

  describe('Headers and help texts', () => {
    describe('Headers first', () => {
      it('Empty help texts', () => {
        const states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'}
        ];

        const headerState: HeaderState = headerMetaReducer(
          initialHeaderState,
          HeaderActions.createDeserializeHeaders(states, [], 0, 0));
        expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
        expect(headerState.backlog).toEqual(0);
        expect(headerState.categories.toArray()).toEqual([]);
        expect(headerState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
        expect(headerState.wip.toArray()).toEqual([0, 0, 0]);
        expect(headerState.helpTexts.size).toBe(0);

        const newState: HeaderState = headerMetaReducer(
          headerState,
          HeaderActions.createLoadHelpTexts({})
        );
        expect(headerState).toBe(newState);
      });

      it('With help texts', () => {
        const states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'}
        ];

        const headerState: HeaderState = headerMetaReducer(
          initialHeaderState,
          HeaderActions.createDeserializeHeaders(states, [], 0, 0));
        expect(headerState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
        expect(headerState.backlog).toEqual(0);
        expect(headerState.categories.toArray()).toEqual([]);
        expect(headerState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
        expect(headerState.wip.toArray()).toEqual([0, 0, 0]);
        expect(headerState.helpTexts.size).toBe(0);

        const newState: HeaderState = headerMetaReducer(
          headerState,
          HeaderActions.createLoadHelpTexts({'S1': 'Help1', 'S2': 'Help2'})
        );
        expect(newState.states).toBe(headerState.states);
        expect(newState.backlog).toBe(headerState.backlog);
        expect(newState.categories).toBe(headerState.categories);
        expect(newState.stateToCategoryMappings).toBe(headerState.stateToCategoryMappings);
        expect(newState.wip).toBe(headerState.wip);
        expect(newState.helpTexts.toObject()).toEqual({'S1': 'Help1', 'S2': 'Help2'});
      });
    });

    describe('Help texts first', () => {
      // This will not happen in practice - the board will make sure to load up the main board first, and then the help.
      // Still, it is trivial to test
      it('Empty help texts', () => {
        const headerState: HeaderState = headerMetaReducer(
          initialHeaderState,
          HeaderActions.createLoadHelpTexts({})
        );
        expect(headerState).toBe(initialHeaderState);

        const states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'}
        ];

        const newState: HeaderState = headerMetaReducer(
          initialHeaderState,
          HeaderActions.createDeserializeHeaders(states, [], 0, 0));
        expect(newState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
        expect(newState.backlog).toEqual(0);
        expect(newState.categories.toArray()).toEqual([]);
        expect(newState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
        expect(newState.wip.toArray()).toEqual([0, 0, 0]);
        expect(newState.helpTexts.size).toBe(0);
      });

      it('With help texts', () => {
        const headerState: HeaderState =
          headerMetaReducer(initialHeaderState, HeaderActions.createLoadHelpTexts({'S1': 'Help1', 'S2': 'Help2'}))
        expect(headerState.states.toArray()).toEqual([]);
        expect(headerState.helpTexts.toObject()).toEqual({'S1': 'Help1', 'S2': 'Help2'});

        const states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'}
        ];

        const newState: HeaderState = headerMetaReducer(
          initialHeaderState,
          HeaderActions.createDeserializeHeaders(states, [], 0, 0));
        expect(newState.states.toArray()).toEqual(['S1', 'S2', 'S3']);
        expect(newState.backlog).toEqual(0);
        expect(newState.categories.toArray()).toEqual([]);
        expect(newState.stateToCategoryMappings.toArray()).toEqual([-1, -1, -1]);
        expect(newState.wip.toArray()).toEqual([0, 0, 0]);
        expect(headerState.helpTexts.toObject()).toEqual({'S1': 'Help1', 'S2': 'Help2'});
      });
    });
  });
});
