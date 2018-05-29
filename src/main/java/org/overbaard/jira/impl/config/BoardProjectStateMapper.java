package org.overbaard.jira.impl.config;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.Property;
import org.overbaard.jira.impl.Constants;

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

    static BoardProjectStateMapper load(ModelNode statesLinks, BoardStates boardStates) {
        Map<String, String> ownToBoardStates = new LinkedHashMap<>();
        Map<String, String> boardToOwnStates = new HashMap<>();
        for (Property prop : statesLinks.asPropertyList()) {
            final String ownState = prop.getName();
            final String boardState = prop.getValue().asString();
            ownToBoardStates.put(ownState, boardState);
            boardToOwnStates.put(boardState, ownState);
        }

        int i = 0;
        Map<String, Integer> states = new LinkedHashMap<>();
        for (String boardState : boardStates.getStateNames()) {
            final String ownState = boardToOwnStates.get(boardState);
            if (ownState != null) {
                states.put(ownState, i++);
            }
        }

        return new BoardProjectStateMapper(
                boardStates,
                Collections.unmodifiableMap(states),
                Collections.unmodifiableMap(ownToBoardStates),
                Collections.unmodifiableMap(boardToOwnStates));
    }

    public Integer mapOwnStateOntoBoardStateIndex(String state) {
        String boardState = mapOwnStateOntoBoardState(state);
        return boardStates.getStateIndex(boardState);

    }

    private String mapBoardStateOntoOwnState(String boardState) {
        return boardToOwnStates.get(boardState);
    }

    private String mapOwnStateOntoBoardState(String state) {
        return ownToBoardStates.get(state);
    }

    public Set<String> getOwnDoneStateNames() {
        return ownDoneStateNames;
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

    ModelNode serializeModelNodeForConfig() {
        // Here we use ownState -> boardState
        ModelNode stateLinksNode = new ModelNode();
        for (Map.Entry<String, String> entry : ownToBoardStates.entrySet()) {
            stateLinksNode.get(entry.getKey()).set(entry.getValue());
        }
        return stateLinksNode;
    }

    ModelNode serializeModelNodeForBoard() {
        // Here we use boardState -> ownState
        ModelNode stateLinks = new ModelNode();
        for (String state : boardStates.getStateNames()) {
            String myState = mapBoardStateOntoOwnState(state);
            if (myState != null) {
                stateLinks.get(state).set(new ModelNode(myState));
            }
        }
        return stateLinks;
    }

}
