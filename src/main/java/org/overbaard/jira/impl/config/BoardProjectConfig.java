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

    private final BoardProjectIssueTypeOverrideConfig issueTypeOverrideConfig;

    private final List<LinkedIssueFilterConfig> linkedIssueFilterConfigs;
    private final Map<String, LinkedIssueFilterConfig> linkedIssueFilterConfigsByLinkedProject;

    private final InternalAdvanced internalAdvanced;

    private BoardProjectConfig(
            final String code, final String queryFilter,
            final String colour,
            final BoardProjectStateMapper stateMapper,
            final List<String> customFieldNames,
            final ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig,
            final List<LinkedIssueFilterConfig> linkedIssueFilterConfigs,
            final BoardProjectIssueTypeOverrideConfig issueTypeOverrideConfig) {
        super(code, stateMapper);
        this.queryFilter = queryFilter;
        this.colour = colour;
        this.parallelTaskGroupsConfig = parallelTaskGroupsConfig;
        this.customFieldNames = customFieldNames;
        this.linkedIssueFilterConfigs = linkedIssueFilterConfigs;
        this.issueTypeOverrideConfig = issueTypeOverrideConfig;
        this.internalAdvanced = new InternalAdvanced();
        this.linkedIssueFilterConfigsByLinkedProject = LinkedIssueFilterConfig.convertToMap(linkedIssueFilterConfigs);
    }

    static BoardProjectConfig load(final BoardStates boardStates, ModelNode project,
                                   CustomFieldRegistry<CustomFieldConfig> customFieldConfigs,
                                   BoardParallelTaskConfig parallelTaskConfig, Set<String> issueTypes,
                                   Set<String> linkedProjectNames) {
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
            projectParallelTaskGroupsConfig = ProjectParallelTaskGroupsConfig.loadAndValidate(parallelTaskConfig, parallelTaskGroups, projectCode);
        } else {
            projectParallelTaskGroupsConfig = null;
        }

        final List<LinkedIssueFilterConfig> linkedIssueFilterConfigs = new ArrayList<>();
        if (project.hasDefined(Constants.LINKED_ISSUES)) {
            ModelNode linkedIssuesNode = project.get(Constants.LINKED_ISSUES);
            if (linkedIssuesNode.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("The \"linked-issues\" element of project \"" + projectCode + "\" must be a list");
            }

            Set<String> seenProjects = new HashSet<>();
            List<ModelNode> list = linkedIssuesNode.asList();

            for (int i = 0 ; i < list.size() ; i++) {
                ModelNode curr = list.get(i);
                if (curr.getType() != ModelType.OBJECT) {
                    throw new OverbaardValidationException("The \"linked-issues\" element entries of project \"" + projectCode + "\" must be maps");
                }
                LinkedIssueFilterConfig filterConfig = LinkedIssueFilterConfig.loadForBoardProject(linkedProjectNames, projectCode, curr);
                for (String projectName : filterConfig.getProjects()) {
                    if (!seenProjects.add(projectName)) {
                        throw new OverbaardValidationException(
                                "The \"linked-issues\" entries in project '" +
                                        projectCode + "' uses project '" + projectName + "' more than once");
                    }
                }
                linkedIssueFilterConfigs.add(filterConfig);
            }
        }


        BoardProjectIssueTypeOverrideConfig issueTypeOverrides =
                BoardProjectIssueTypeOverrideConfig.load(project.get(Constants.OVERRIDES), boardStates, parallelTaskConfig, projectCode, issueTypes, linkedProjectNames);
        ModelNode statesLinks = Util.getRequiredChild(project, "Project", projectCode, Constants.STATE_LINKS);
        BoardProjectStateMapper stateMapper = BoardProjectStateMapper.load(statesLinks, boardStates);
        return new BoardProjectConfig(
                projectCode, loadQueryFilter(project), colour,
                stateMapper,
                Collections.unmodifiableList(customFieldNames),
                projectParallelTaskGroupsConfig,
                Collections.unmodifiableList(linkedIssueFilterConfigs),
                issueTypeOverrides);
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

    public BoardProjectIssueTypeOverrideConfig getIssueTypeOverrideConfig() {
        return issueTypeOverrideConfig;
    }

    ModelNode serializeModelNodeForBoard() {
        ModelNode projectNode = new ModelNode();
        projectNode.get(Constants.CODE).set(code);

        projectNode.get(Constants.STATE_LINKS).set(projectStates.serializeModelNodeForBoard());

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
            projectNode.get(Constants.PARALLEL_TASKS).set(parallelTaskGroupsConfig.serializeForConfig());
        }

        projectNode.get(Constants.STATE_LINKS).set(projectStates.serializeModelNodeForConfig());

        if (linkedIssueFilterConfigs.size() > 0) {
            final ModelNode linkedIssuesNode = projectNode.get(Constants.LINKED_ISSUES);
            linkedIssuesNode.setEmptyList();
            for (LinkedIssueFilterConfig entry : linkedIssueFilterConfigs) {
                linkedIssuesNode.add(entry.serializeModelNodeForConfig());
            }
        }


        final ModelNode issueTypeOverrides = this.issueTypeOverrideConfig.serializeModelNodeForConfig();
        if (issueTypeOverrides.isDefined()) {
            projectNode.get(Constants.OVERRIDES).set(issueTypeOverrides);
        }

        return projectNode;
    }

    public List<String> getCustomFieldNames() {
        OverbaardLogger.LOGGER.trace("Custom fields for project {} are {}", getCode(), customFieldNames);
        return customFieldNames;
    }

    @Override
    public BoardProjectStateMapper getProjectStatesLinks(String issueType) {
        if (issueTypeOverrideConfig != null) {
            BoardProjectStateMapper states = issueTypeOverrideConfig.getStateLinksOverride(issueType);
            if (states != null) {
                return states;
            }
        }
        return projectStates;
    }

    public ProjectParallelTaskGroupsConfig getParallelTaskGroupsConfig(String issueType) {
        if (issueTypeOverrideConfig != null) {
            ProjectParallelTaskGroupsConfig config = issueTypeOverrideConfig.getParallelTaskGroupsConfig(issueType);
            if (config != null) {
                return config == ProjectParallelTaskGroupsConfig.EMPTY_OVERRIDE ? null : config;
            }
        }
        return parallelTaskGroupsConfig;
    }

    public Map<String, LinkedIssueFilterConfig> getLinkedIssueFilterConfig(String issueType) {
        if (issueTypeOverrideConfig != null) {
            Map<String, LinkedIssueFilterConfig> config = issueTypeOverrideConfig.getLinkedIssueFilters(issueType);
            if (config != null) {
                return config;
            }
        }
        return linkedIssueFilterConfigsByLinkedProject;
    }

    public Map<Long, ParallelTaskCustomFieldConfig> getAllParallelTaskCustomFieldConfigs() {
        Map<Long, ParallelTaskCustomFieldConfig> cfgs = new HashMap<>();
        if (parallelTaskGroupsConfig != null) {
            for (ParallelTaskCustomFieldConfig cfg : parallelTaskGroupsConfig.getConfigs().values()) {
                cfgs.put(cfg.getId(), cfg);
            }
        }
        if (issueTypeOverrideConfig != null) {
            for (ProjectParallelTaskGroupsConfig config : issueTypeOverrideConfig.getParallelTaskGroupsOverrides().values()) {
                for (ParallelTaskCustomFieldConfig cfg : config.getConfigs().values()) {
                    cfgs.put(cfg.getId(), cfg);
                }
            }
        }
        return cfgs;
    }

    public InternalAdvanced getInternalAdvanced() {
        return internalAdvanced;
    }

    /**
     * Generally the getters that take an issueType should be used, but for some 'setup' type stuff we need the
     * full thing. Put those into this class in an attempt to avoid people accidentally calling these
     */
    public class InternalAdvanced {
        private InternalAdvanced() {
        }

        public BoardProjectStateMapper getProjectStateLinks() {
            return projectStates;
        }

        public Map<String, BoardProjectStateMapper> getIssueTypeStateLinksOverrides() {
            return issueTypeOverrideConfig.getStateLinkOverrides();
        }

        public ProjectParallelTaskGroupsConfig getParallelTaskGroupsConfig() {
            return parallelTaskGroupsConfig;
        }

        public Map<String, ProjectParallelTaskGroupsConfig> getIssueTypeParallelTaskGroupsOverrides() {
            return issueTypeOverrideConfig.getParallelTaskGroupsOverrides();
        }
    }
}
