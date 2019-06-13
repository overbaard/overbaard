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

import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * Project which does not appear on the board as a card, but is linked to from the cards.
 *
 * @author Kabir Khan
 */
public class LinkedProjectConfig extends ProjectConfig {

    private final Map<String, ProjectStateList> typeStateOverrides;

    private LinkedProjectConfig(final String code, final ProjectStateList states, final Map<String, ProjectStateList> typeStateOverrides) {
        super(code, states);
        this.typeStateOverrides = typeStateOverrides;
    }

    static LinkedProjectConfig load(final String projectCode, final ModelNode project) {
        ModelNode states = project.get(Constants.STATES);
        if (states.getType() != ModelType.LIST) {
            throw new OverbaardValidationException(Constants.STATES + " of linked-project['" + projectCode + "'] must be an array");
        }
        final ProjectStateList projectStateList = new ProjectStateList(Collections.unmodifiableMap(getStringIntegerMap(states.asList())));

        final Map<String, ProjectStateList> typeStateOverrides;
        if (project.has(Constants.TYPE_STATES)) {
            ModelNode typeStates = project.get(Constants.TYPE_STATES);
            if (typeStates.getType() != ModelType.OBJECT) {
                throw new OverbaardValidationException(Constants.TYPE_STATES + " of linked-project['" + projectCode + "'] must be a map");
            }
            typeStateOverrides = new HashMap<>();
            for (String type : typeStates.keys()) {
                ModelNode overrideStates = typeStates.get(type);
                if (overrideStates.getType() != ModelType.LIST && overrideStates.isDefined()) {
                    throw new OverbaardValidationException(Constants.TYPE_STATES + "[" + type + "]" + " of linked-project['" + projectCode + "'] must be an array");
                }
                ProjectStateList typeStateList = overrideStates.isDefined() ?
                        new ProjectStateList(Collections.unmodifiableMap(getStringIntegerMap(overrideStates.asList()))) : null;
                typeStateOverrides.put(type, typeStateList);
            }
        } else {
            typeStateOverrides = Collections.emptyMap();
        }
        return new LinkedProjectConfig(projectCode, projectStateList, typeStateOverrides);
    }

    private static Map<String, Integer> getStringIntegerMap(final List<ModelNode> statesList) {
        Map<String, Integer> statesMap = new LinkedHashMap<>();
        for (int i = 0; i < statesList.size(); i++) {
            statesMap.put(statesList.get(i).asString(), i);
        }
        return statesMap;
    }

    @Override
    public ProjectStateList getProjectStatesLinks(String issueType) {
        if (typeStateOverrides != null) {
            ProjectStateList override = typeStateOverrides.get(issueType);
            if (override != null) {
                return override;
            }
        }
        return super.projectStates;
    }

    public boolean hasTypeLinks(String issueType) {
        if (typeStateOverrides != null) {
            ProjectStateList override = typeStateOverrides.get(issueType);
            if (override != null) {
                return true;
            }
        }
        return false;
    }

    ModelNode serializeModelNodeForConfig() {
        final ModelNode projectNode = new ModelNode();
        if (projectStates != null) {
            final ModelNode statesNode = projectNode.get(Constants.STATES);
            statesNode.setEmptyList();
            for (String state : projectStates.getStates().keySet()) {
                statesNode.add(state);
            }
        }
        if (typeStateOverrides.size() > 0) {
            final ModelNode typeStatesNode = projectNode.get(Constants.TYPE_STATES);
            typeStatesNode.setEmptyObject();
            for (Map.Entry<String, ProjectStateList> typeOverride : typeStateOverrides.entrySet()) {
                ModelNode overrideNode = new ModelNode();
                if (typeOverride.getValue() != null) {
                    overrideNode.setEmptyList();
                    for (String state : typeOverride.getValue().getStates().keySet()) {
                        overrideNode.add(state);
                    }
                }
                typeStatesNode.get(typeOverride.getKey()).set(overrideNode);
            }
        }
        return projectNode;
    }

    ModelNode serializeModelNodeForBoard() {
        return serializeModelNodeForConfig();
    }
}
