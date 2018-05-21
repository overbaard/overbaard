package org.overbaard.jira.impl.config;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardProjectStateMapper extends ProjectStateList {

    private final Map<String, String> ownToBoardStates;
    private final BoardStates boardStates;
    /** Maps the owner states onto our states */
    private final Map<String, String> boardToOwnStates;

    private final Set<String> ownDoneStateNames;

    public BoardProjectStateMapper(
            final BoardStates boardStates,
            final Map<String, Integer> states,
            final Map<String, String> ownToBoardStates,
            final Map<String, String> boardToOwnStates) {

        super(states);
        this.boardStates = boardStates;
        this.boardToOwnStates = boardToOwnStates;
        this.ownToBoardStates = ownToBoardStates;
        Set<String> ownDoneStateNames = new HashSet<>();
        for (String boardDoneState : boardStates.getDoneStates()) {
            String ownDoneState = boardToOwnStates.get(boardDoneState);
            if (ownDoneState != null) {
                ownDoneStateNames.add(ownDoneState);
            }
        }
        this.ownDoneStateNames = Collections.unmodifiableSet(ownDoneStateNames);
    }

    public Integer mapOwnStateOntoBoardStateIndex(String state) {
        String boardState = mapOwnStateOntoBoardState(state);
        return boardStates.getStateIndex(boardState);

    }
    public String mapBoardStateOntoOwnState(String boardState) {
        return boardToOwnStates.get(boardState);
    }

    public String mapOwnStateOntoBoardState(String state) {
        return ownToBoardStates.get(state);
    }

    public Set<String> getOwnDoneStateNames() {
        return ownDoneStateNames;
    }

    public Map<String, String> getOwnToBoardStates() {
        return ownToBoardStates;
    }

    public boolean isBacklogState(String ownState) {
        return isBacklogState(mapOwnStateOntoBoardStateIndex(ownState));
    }

    public boolean isDoneState(String ownState) {
        Integer boardStateIndex = mapOwnStateOntoBoardStateIndex(ownState);
        return boardStateIndex == null ? false : isDoneState(boardStateIndex);
    }

    private boolean isBacklogState(int boardStateIndex) {
        return boardStates.isBacklogState(boardStateIndex);
    }

    boolean isDoneState(int boardStateIndex) {
        return boardStates.isDoneState(boardStateIndex);
    }

}
