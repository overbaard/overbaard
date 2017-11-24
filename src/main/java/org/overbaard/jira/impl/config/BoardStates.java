/*
 * Copyright 2016 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.overbaard.jira.impl.config;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * @author Kabir Khan
 */
public class BoardStates {
    private final Map<String, Integer> stateIndices;
    private final List<String> states;
    private final Map<String, String> stateHeaders;
    private final Map<String, String> stateHelpTexts;
    private final Set<String> backlogStates;
    private final Set<String> doneStates;
    private final Map<String, Integer> wipLimits;

    private BoardStates(Map<String, Integer> stateIndices, List<String> states, Map<String, String> stateHeaders,
                        Map<String, String> stateHelpTexts,
                        Set<String> backlogStates, Set<String> doneStates, Map<String, Integer> wipLimits) {
        this.stateIndices = stateIndices;
        this.states = states;
        this.stateHeaders = stateHeaders;
        this.stateHelpTexts = stateHelpTexts;
        this.backlogStates = backlogStates;
        this.doneStates = doneStates;
        this.wipLimits = wipLimits;
    }

    static BoardStates loadBoardStates(ModelNode statesNode) {
        if (!statesNode.isDefined()) {
            throw new OverbaardValidationException("A board must have some states associated with it");
        }
        final Set<String> seenHeaders = new HashSet<>();
        final List<String> states = new ArrayList<>();
        final Map<String, String> stateHeaders = new HashMap<>();
        final Map<String, String> stateHelpTexts = new HashMap<>();
        final Map<String, Integer> stateIndices = new LinkedHashMap<>();
        final Set<String> backlogStates = new HashSet<>();
        final Set<String> doneStates = new HashSet<>();
        final Map<String, Integer> wipLimits = new HashMap<>();
        try {
            String lastHeader = null;
            int i = 0;
            int lastBacklog = -1;
            int lastDone = -1;
            for (ModelNode stateNode : statesNode.asList()) {
                if (!stateNode.hasDefined(Constants.NAME)) {
                    throw new OverbaardValidationException("A state must have a name");
                }
                final String stateName = stateNode.get(Constants.NAME).asString();
                if (states.contains(stateName)) {
                    throw new OverbaardValidationException("State names for a project must be unique");
                }
                states.add(stateName);
                stateIndices.put(stateName, i);

                if (stateNode.hasDefined(Constants.HELP)) {
                    stateHelpTexts.put(stateName, stateNode.get(Constants.HELP).asString());
                }

                boolean backlog = stateNode.hasDefined(Constants.BACKLOG) && stateNode.get(Constants.BACKLOG).asBoolean();
                boolean done = stateNode.hasDefined(Constants.DONE) && stateNode.get(Constants.DONE).asBoolean();
                String headerName = stateNode.hasDefined(Constants.HEADER) ? stateNode.get(Constants.HEADER).asString() : null;

                if ( (backlog ? 1:0)+ (done ? 1:0) + (headerName != null ? 1:0) > 1) {
                    throw new OverbaardValidationException("A state can use at the most one of [backlog, done, header]");
                }

                if ( (backlog ? 1:0)+ (done ? 1:0) > 1) {
                    throw new OverbaardValidationException("A state can use at the most one of [backlog, done]");
                }

                if (backlog) {
                    if (lastBacklog < i - 1) {
                        throw new OverbaardValidationException("The backlog states can only be the first states without any gaps");
                    }
                    backlogStates.add(stateName);
                    lastBacklog = i;
                }

                if (done) {
                    if (lastDone > -1 && lastDone < i - 1) {
                        throw new OverbaardValidationException("The done states should be consecutive.");
                    }
                    doneStates.add(stateName);
                    lastDone = i;
                }

                if (headerName != null) {
                    if (!headerName.equals(lastHeader) && seenHeaders.contains(headerName)) {
                        throw new OverbaardValidationException("A state header must be used on neighbouring states. " +
                            "There can't be any gaps as in '" + headerName + "' used for '" + stateName + "'.");
                    }
                    stateHeaders.put(stateName, headerName);
                    seenHeaders.add(headerName);
                    lastHeader = headerName;
                } else {
                    lastHeader = null;
                }

                if (stateNode.hasDefined(Constants.WIP)) {
                    if (backlog) {
                        throw new OverbaardValidationException("Cannot configure  'wip' for state '" + stateName + "' since it is also configured as a backlog state");
                    }
                    try {
                        int wip = stateNode.get(Constants.WIP).asInt();
                        if (wip == 0) {
                            throw new OverbaardValidationException("0 is not a valid value for the 'wip' field for state '" + stateName + "'");
                        }
                        wipLimits.put(stateName, wip);
                    } catch (IllegalStateException e) {
                        throw new OverbaardValidationException("The 'wip' field for state '" + stateName + "' must be an integer");
                    }
                }

                i++;
            }
            if (lastDone > -1 && lastDone < i - 1) {
                throw new OverbaardValidationException("The done states should be at the end, they cannot be in the middle of the list of states");
            }
        } catch (IllegalStateException e) {
            throw new OverbaardValidationException("A board must have some states associated with it, and it should be an array strings");
        }

        return new BoardStates(
                Collections.unmodifiableMap(stateIndices),
                Collections.unmodifiableList(states),
                Collections.unmodifiableMap(stateHeaders),
                Collections.unmodifiableMap(stateHelpTexts),
                Collections.unmodifiableSet(backlogStates),
                Collections.unmodifiableSet(doneStates),
                Collections.unmodifiableMap(wipLimits));
    }


    ModelNode toModelNodeForConfig(ModelNode parent) {
        final ModelNode states = new ModelNode();
        states.setEmptyList();

        for (String state : this.states) {
            final ModelNode stateNode = new ModelNode();
            stateNode.get(Constants.NAME).set(state);

            final String help = stateHelpTexts.get(state);
            if (help != null) {
                stateNode.get(Constants.HELP).set(help);
            }

            final String header = stateHeaders.get(state);
            if (header != null) {
                stateNode.get(Constants.HEADER).set(header);
            }
            if (backlogStates.contains(state)) {
                stateNode.get(Constants.BACKLOG).set(true);
            }
            if (doneStates.contains(state)) {
                stateNode.get(Constants.DONE).set(true);
            }
            final Integer wipLimit = wipLimits.get(state);
            if (wipLimit != null) {
                stateNode.get(Constants.WIP).set(wipLimit);
            }
            states.add(stateNode);
        }

        parent.get(Constants.STATES).set(states);
        return states;
    }

    ModelNode toModelNodeForBoard(ModelNode parent) {
        final ModelNode states = new ModelNode();
        states.setEmptyList();

        Set<String> headers = new LinkedHashSet<>();
        final ModelNode headersNode = new ModelNode();

        for (int i = 0 ; i < this.states.size() ; i++) {
            final String state = this.states.get(i);
            final ModelNode stateNode = new ModelNode();
            stateNode.get(Constants.NAME).set(state);

            final String header = stateHeaders.get(state);
            if (header != null) {
                if (!headers.contains(header)) {
                    headers.add(header);
                    headersNode.add(header);
                }
                stateNode.get(Constants.HEADER).set(headers.size() - 1);
            }
            final Integer wipLimit = wipLimits.get(state);
            if (wipLimit != null) {
                stateNode.get(Constants.WIP).set(wipLimit);
            }

            states.add(stateNode);
        }

        parent.get(Constants.STATES).set(states);

        if (headers.size() > 0) {
            parent.get(Constants.HEADERS).set(headersNode);
        }
        if (backlogStates.size() > 0) {
            parent.get(Constants.BACKLOG).set(backlogStates.size());
        }
        if (doneStates.size() > 0) {
            parent.get(Constants.DONE).set(doneStates.size());
        }
        return states;
    }

    public Integer getStateIndex(String boardState) {
        return stateIndices.get(boardState);
    }

    public List<String> getStateNames() {
        return states;
    }

    public Set<String> getBacklogStates() {
        return backlogStates;
    }

    public boolean isBacklogState(int boardStateIndex) {
        return boardStateIndex < backlogStates.size();
    }

    public boolean isDoneState(int boardStateIndex) {
        String state = states.get(boardStateIndex);
        return doneStates.contains(state);
    }

    public Set<String> getDoneStates() {
        return doneStates;
    }

    public Map<String, String> getStateHelpTexts() {
        return stateHelpTexts;
    }
}
