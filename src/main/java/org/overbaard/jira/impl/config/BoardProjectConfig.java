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
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.jboss.dmr.Property;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/** Abstract base class for project configurations of projects whose issues should appear as cards on the board.
 * @author Kabir Khan
 */
public class BoardProjectConfig extends ProjectConfig<BoardProjectStateMapper> {
    private final String queryFilter;
    private final String colour;

    private final List<String> customFieldNames;
    private final ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig;

    private BoardProjectConfig(final BoardStates boardStates,
                               final String code, final String queryFilter,
                               final String colour, final Map<String, Integer> states,
                               final Map<String, String> ownToBoardStates,
                               final Map<String, String> boardToOwnStates,
                               final List<String> customFieldNames,
                               final ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig) {
        super(code, new BoardProjectStateMapper(boardStates, states, ownToBoardStates, boardToOwnStates));
        this.queryFilter = queryFilter;
        this.colour = colour;
        this.parallelTaskGroupsConfig = parallelTaskGroupsConfig;
        this.customFieldNames = customFieldNames;
    }

    static BoardProjectConfig load(final BoardStates boardStates, ModelNode project,
                                   CustomFieldRegistry<CustomFieldConfig> customFieldConfigs, BoardParallelTaskConfig parallelTaskConfig) {
        String projectCode = Util.getRequiredChild(project, "Project", null, Constants.CODE).asString();
        String colour = Util.getRequiredChild(project, "Project", projectCode, Constants.COLOUR).asString();
        ModelNode statesLinks = Util.getRequiredChild(project, "Project", projectCode, Constants.STATE_LINKS);

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


        final List<String> customFieldNames;
        if (!project.hasDefined(Constants.CUSTOM)) {
            customFieldNames = Collections.emptyList();
        } else {
            customFieldNames = new ArrayList<>();
            final ModelNode customFieldNode = project.get(Constants.CUSTOM);
            if (customFieldNode.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("The \"custom\" element of project \"" + projectCode + "\" must be an array of strings");
            }
            for (ModelNode field : customFieldNode.asList()) {
                final String fieldName = field.asString();
                if (customFieldConfigs.getForOverbaardName(fieldName) == null) {
                    throw new OverbaardValidationException("The \"custom\" element of project \"" + projectCode + "\" contains \"" + fieldName + "\", which does not exist in the board's \"custom\" section.");
                }
                customFieldNames.add(fieldName);
            }
        }

        final ProjectParallelTaskGroupsConfig projectParallelTaskGroupsConfig;
        if (project.hasDefined(Constants.PARALLEL_TASKS)) {
            ModelNode parallelTaskGroups = project.get(Constants.PARALLEL_TASKS);
            if (parallelTaskGroups.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("The \"parallel-task-groups\" element of project \"" + projectCode + "\" must be an array");
            }
            List<Map<String, ParallelTaskCustomFieldConfig>> fieldConfigs = new ArrayList<>();

            for (ModelNode parallelTaskGroup : parallelTaskGroups.asList()) {
                if (parallelTaskGroups.getType() != ModelType.LIST) {
                    throw new OverbaardValidationException("The \"parallel-task-groups\" element of project \"" + projectCode + "\" must be an array");
                }
                Map<String, ParallelTaskCustomFieldConfig> groupFieldConfigs = new LinkedHashMap<>();
                boolean first = true;
                for (ModelNode parallelTask : parallelTaskGroup.asList()) {
                    ParallelTaskCustomFieldConfig fieldConfig = parallelTaskConfig.getConfigs().getForOverbaardName(parallelTask.asString());
                    if (fieldConfig == null) {
                        throw new OverbaardValidationException("The \"parallel-task-groups\" element of project \"" + projectCode + "\" " +
                                "references a parallel task '" + parallelTask.asString() + "' which does not exist in the global parallel-tasks fields list");
                    }
                    groupFieldConfigs.put(fieldConfig.getName(), fieldConfig);
                    if (first) {
                        fieldConfigs.add(groupFieldConfigs);
                        first = false;
                    }
                }
            }
            projectParallelTaskGroupsConfig = new ProjectParallelTaskGroupsConfig(fieldConfigs);
        } else {
            projectParallelTaskGroupsConfig = null;
        }

        return new BoardProjectConfig(boardStates, projectCode, loadQueryFilter(project), colour,
                Collections.unmodifiableMap(states),
                Collections.unmodifiableMap(ownToBoardStates),
                Collections.unmodifiableMap(boardToOwnStates),
                Collections.unmodifiableList(customFieldNames),
                projectParallelTaskGroupsConfig);
    }


    static String loadQueryFilter(ModelNode project) {
        if (!project.hasDefined(Constants.QUERY_FILTER)) {
            return null;
        }
        String filter = project.get(Constants.QUERY_FILTER).asString().trim();
        if (filter.length() == 0) {
            return null;
        }
        return filter;
    }

    public String getQueryFilter() {
        return queryFilter;
    }

    public String getColour() {
        return colour;
    }

    ModelNode serializeModelNodeForBoard() {
        ModelNode projectNode = new ModelNode();
        projectNode.get(Constants.CODE).set(code);

        ModelNode stateLinksNode = projectNode.get(Constants.STATE_LINKS);
        for (String state : projectStates.getStateNames()) {
            String myState = projectStates.mapBoardStateOntoOwnState(state);
            stateLinksNode.get(state).set(myState == null ? new ModelNode() : new ModelNode(myState));
        }
        projectNode.get(Constants.COLOUR).set(colour);
        return projectNode;
    }

    ModelNode serializeModelNodeForConfig() {
        final ModelNode projectNode = new ModelNode();
        projectNode.get(Constants.CODE).set(code);
        projectNode.get(Constants.QUERY_FILTER).set(queryFilter == null ? new ModelNode() : new ModelNode(queryFilter));
        projectNode.get(Constants.COLOUR).set(colour);

        if (customFieldNames.size() > 0) {
            final ModelNode customFieldsNode = projectNode.get(Constants.CUSTOM);
            for (String customFieldName : customFieldNames) {
                customFieldsNode.add(customFieldName);
            }
        }

        if (parallelTaskGroupsConfig != null) {
            ModelNode parallelTaskGroupsNode = projectNode.get(Constants.PARALLEL_TASKS).setEmptyList();

            for (ProjectParallelTaskConfig ptCfg : parallelTaskGroupsConfig.getGroups()) {
                ModelNode group = new ModelNode().setEmptyList();
                for (ParallelTaskCustomFieldConfig parallelTaskCustomFieldConfig : ptCfg.getConfigs().values()) {
                    group.add(parallelTaskCustomFieldConfig.getName());
                }
                parallelTaskGroupsNode.add(group);
            }
        }

        final ModelNode stateLinksNode = projectNode.get(Constants.STATE_LINKS);
        stateLinksNode.setEmptyObject();
        for (Map.Entry<String, String> entry : projectStates.getOwnToBoardStates().entrySet()) {
            stateLinksNode.get(entry.getKey()).set(entry.getValue());
        }
        return projectNode;
    }

    public List<String> getCustomFieldNames() {
        OverbaardLogger.LOGGER.trace("Custom fields for project {} are {}", getCode(), customFieldNames);
        return customFieldNames;
    }

    public ProjectParallelTaskGroupsConfig getParallelTaskGroupsConfig() {
        return parallelTaskGroupsConfig;
    }
}
