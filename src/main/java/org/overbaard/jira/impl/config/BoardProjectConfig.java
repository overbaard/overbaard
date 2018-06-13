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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
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

    private final BoardProjectIssueTypeOverrides issueTypeOverrides;

    private final InternalAdvanced internalAdvanced;

    private BoardProjectConfig(final BoardStates boardStates,
                               final String code, final String queryFilter,
                               final String colour,
                               final BoardProjectStateMapper stateMapper,
                               final List<String> customFieldNames,
                               final ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig, BoardProjectIssueTypeOverrides issueTypeOverrides) {
        super(code, stateMapper);
        this.queryFilter = queryFilter;
        this.colour = colour;
        this.parallelTaskGroupsConfig = parallelTaskGroupsConfig;
        this.customFieldNames = customFieldNames;
        this.issueTypeOverrides = issueTypeOverrides;
        this.internalAdvanced = new InternalAdvanced();
    }

    static BoardProjectConfig load(final BoardStates boardStates, ModelNode project,
                                   CustomFieldRegistry<CustomFieldConfig> customFieldConfigs,
                                   BoardParallelTaskConfig parallelTaskConfig, Set<String> issueTypes) {
        String projectCode = Util.getRequiredChild(project, "Project", null, Constants.CODE).asString();
        String colour = Util.getRequiredChild(project, "Project", projectCode, Constants.COLOUR).asString();

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

        BoardProjectIssueTypeOverrides issueTypeOverrides = BoardProjectIssueTypeOverrides.load(project.get(Constants.OVERRIDES), boardStates, projectCode, issueTypes);
        ModelNode statesLinks = Util.getRequiredChild(project, "Project", projectCode, Constants.STATE_LINKS);
        BoardProjectStateMapper stateMapper = BoardProjectStateMapper.load(statesLinks, boardStates);
        return new BoardProjectConfig(
                boardStates, projectCode, loadQueryFilter(project), colour,
                stateMapper,
                Collections.unmodifiableList(customFieldNames),
                projectParallelTaskGroupsConfig, issueTypeOverrides);
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

        projectNode.get(Constants.STATE_LINKS).set(projectStates.serializeModelNodeForBoard());

        projectNode.get(Constants.COLOUR).set(colour);

        final ModelNode issueTypeOverrides = this.issueTypeOverrides.serializeModelNodeForBoard();
        if (issueTypeOverrides.isDefined()) {
            projectNode.get(Constants.OVERRIDES).set(issueTypeOverrides);
        }

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

        projectNode.get(Constants.STATE_LINKS).set(projectStates.serializeModelNodeForConfig());

        final ModelNode issueTypeOverrides = this.issueTypeOverrides.serializeModelNodeForConfig();
        if (issueTypeOverrides.isDefined()) {
            projectNode.get(Constants.OVERRIDES).set(issueTypeOverrides);
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

    @Override
    public BoardProjectStateMapper getOverriddenOrProjectStates(String issueType) {
        if (issueTypeOverrides != null) {
            BoardProjectStateMapper states = issueTypeOverrides.getStateLinksOverride(issueType);
            if (states != null) {
                return states;
            }
        }
        return projectStates;
    }

    public InternalAdvanced getInternalAdvanced() {
        return internalAdvanced;
    }

    /**
     * This should not be called normally {@link #getOverriddenOrProjectStates(String)} should be preferred.
     * When it is really needed, it can be accessed via {@link #getInternalAdvanced()}
     * @return the project state mapper
     */
    private BoardProjectStateMapper getProjectStateLinks() {
        return projectStates;
    }

    /**
     * This should not be called normally {@link #getOverriddenOrProjectStates(String)} should be preferred
     * When it is really needed, it can be accessed via {@link #getInternalAdvanced()}
     * @return the overridden state mappers by issue types
     */
    private Map<String, BoardProjectStateMapper> getIssueTypeStateLinksOverrides() {
        return issueTypeOverrides.getStateLinkOverrides();
    }

    public class InternalAdvanced {
        private InternalAdvanced() {
        }

        public BoardProjectStateMapper getProjectStateLinks() {
            return BoardProjectConfig.this.getProjectStateLinks();
        }

        public Map<String, BoardProjectStateMapper> getIssueTypeStateLinksOverrides() {
            return BoardProjectConfig.this.getIssueTypeStateLinksOverrides();
        }
    }
}
