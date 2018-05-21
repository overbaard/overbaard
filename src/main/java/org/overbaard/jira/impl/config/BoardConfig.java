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

import static org.overbaard.jira.impl.Constants.CODE;
import static org.overbaard.jira.impl.Constants.COLOUR;
import static org.overbaard.jira.impl.Constants.CUSTOM;
import static org.overbaard.jira.impl.Constants.FIELDS;
import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.LINKED;
import static org.overbaard.jira.impl.Constants.LINKED_PROJECTS;
import static org.overbaard.jira.impl.Constants.MAIN;
import static org.overbaard.jira.impl.Constants.NAME;
import static org.overbaard.jira.impl.Constants.PARALLEL_TASKS;
import static org.overbaard.jira.impl.Constants.PRIORITIES;
import static org.overbaard.jira.impl.Constants.PROJECTS;
import static org.overbaard.jira.impl.Constants.RANK_CUSTOM_FIELD_ID;
import static org.overbaard.jira.impl.Constants.STATES;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.JiraInjectables;

import com.atlassian.jira.config.IssueTypeManager;
import com.atlassian.jira.config.PriorityManager;
import com.atlassian.jira.issue.issuetype.IssueType;
import com.atlassian.jira.issue.priority.Priority;

/**
 * The set of projects to be displayed on a board. The 'owner' is the project which contains the
 * states. The 'board' projects include the 'owner' and the other projects whose issues should be displayed as cards
 * on the Kanban board. The non-'owner' projects map their states onto the 'owner's states. The 'linked' projects are
 * 'upstream' projects, which we are interested in linking to from the 'main' projects' boards.
 *
 * @author Kabir Khan
 */
public class BoardConfig {

    private final int id;
    private final String code;
    private final String name;
    private final String owningUserKey;
    /** The 'Rank' custom field as output by  */
    private final long rankCustomFieldId;
    private final BoardStates boardStates;
    private final Map<String, BoardProjectConfig> boardProjects;
    private final Map<String, LinkedProjectConfig> linkedProjects;
    private final Map<String, NameAndColour> priorities;
    private final Map<String, Integer> priorityIndex;
    private final List<String> priorityNames;
    private final Map<String, NameAndColour> issueTypes;
    private final Map<String, Integer> issueTypeIndex;
    private final List<String> issueTypeNames;

    private final CustomFieldRegistry<CustomFieldConfig> customFields;
    private final BoardParallelTaskConfig parallelTaskConfig;

    private BoardConfig(int id, String code, String name, String owningUserKey,
                        long rankCustomFieldId,
                        BoardStates boardStates,
                        Map<String, BoardProjectConfig> boardProjects, Map<String, LinkedProjectConfig> linkedProjects,
                        Map<String, NameAndColour> priorities, Map<String, NameAndColour> issueTypes,
                        CustomFieldRegistry<CustomFieldConfig> customFields,
                        BoardParallelTaskConfig parallelTaskConfig) {

        this.id = id;
        this.code = code;
        this.name = name;
        this.owningUserKey = owningUserKey;
        this.rankCustomFieldId = rankCustomFieldId;
        this.boardStates = boardStates;
        this.boardProjects = boardProjects;
        this.linkedProjects = linkedProjects;

        this.priorities = priorities;
        Map<String, Integer> priorityIndex = new HashMap<>();
        List<String> priorityNames = new ArrayList<>();
        getIndexMap(priorities, priorityIndex, priorityNames);
        this.priorityIndex = Collections.unmodifiableMap(priorityIndex);
        this.priorityNames = Collections.unmodifiableList(priorityNames);

        this.issueTypes = issueTypes;
        Map<String, Integer> issueTypeIndex = new HashMap<>();
        List<String> issueTypeNames = new ArrayList<>();
        getIndexMap(issueTypes, issueTypeIndex, issueTypeNames);
        this.issueTypeIndex = Collections.unmodifiableMap(issueTypeIndex);
        this.issueTypeNames = Collections.unmodifiableList(issueTypeNames);

        this.customFields = customFields;
        this.parallelTaskConfig = parallelTaskConfig;
    }

    public static BoardConfig loadAndValidate(JiraInjectables jiraInjectables, int id,
                                              String owningUserKey, String configJson, long rankCustomFieldId) {
        ModelNode boardNode = ModelNode.fromJSONString(configJson);
        return loadAndValidate(jiraInjectables, id, owningUserKey, boardNode, rankCustomFieldId);
    }

    public static BoardConfig loadAndValidate(JiraInjectables jiraInjectables,
                                              int id, String owningUserKey, ModelNode boardNode, long rankCustomFieldId) {
        final String code = Util.getRequiredChild(boardNode, "Group", null, CODE).asString();
        final String boardName = Util.getRequiredChild(boardNode, "Group", null, NAME).asString();


        final BoardStates boardStates = BoardStates.loadBoardStates(boardNode.get(STATES));
        final CustomFieldRegistry<CustomFieldConfig> customFields =
                new CustomFieldRegistry<>(Collections.unmodifiableMap(loadCustomFields(jiraInjectables, boardNode)));
        final BoardParallelTaskConfig parallelTaskConfig = loadBoardParallelTasks(jiraInjectables, customFields, boardNode);

        final ModelNode projects = Util.getRequiredChild(boardNode, "Group", boardName, PROJECTS);
        if (projects.getType() != ModelType.LIST) {
            throw new IllegalStateException("'projects' must be an array");
        }
        final Map<String, BoardProjectConfig> mainProjects = new LinkedHashMap<>();
        for (ModelNode project : projects.asList()) {
            BoardProjectConfig projectConfig = BoardProjectConfig.load(boardStates, project, customFields, parallelTaskConfig);
            mainProjects.put(projectConfig.getCode(), projectConfig);
        }

        final ModelNode linked = boardNode.get(LINKED_PROJECTS);
        final Map<String, LinkedProjectConfig> linkedProjects = new LinkedHashMap<>();
        if (linked.isDefined()) {
            for (String projectName : linked.keys()) {
                ModelNode project = linked.get(projectName);
                linkedProjects.put(projectName, LinkedProjectConfig.load(projectName, project));
            }
        }

        final BoardConfig boardConfig = new BoardConfig(id, code, boardName, owningUserKey,
                rankCustomFieldId,
                boardStates,
                Collections.unmodifiableMap(mainProjects),
                Collections.unmodifiableMap(linkedProjects),
                Collections.unmodifiableMap(loadPriorities(jiraInjectables.getPriorityManager(), boardNode.get(PRIORITIES).asList())),
                Collections.unmodifiableMap(loadIssueTypes(jiraInjectables.getIssueTypeManager(), boardNode.get(ISSUE_TYPES).asList())),
                customFields,
                parallelTaskConfig);
        return boardConfig;
    }

    private static Map<String, CustomFieldConfig> loadCustomFields(final JiraInjectables jiraInjectables, final ModelNode boardNode) {
        if (boardNode.hasDefined(CUSTOM)) {
            ModelNode custom = boardNode.get(CUSTOM);
            if (custom.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("The \"custom\" element must be an array");
            }

            Map<String, CustomFieldConfig> configs = new LinkedHashMap<>();
            final List<ModelNode> customConfigs = custom.asList();
            for (ModelNode customConfig : customConfigs) {
                final CustomFieldConfig customFieldConfig = CustomFieldConfigImpl.loadCustomFieldConfig(jiraInjectables, customConfig);
                configs.put(customFieldConfig.getName(), customFieldConfig);
            }
            return configs;
        }
        return Collections.emptyMap();
    }

    private static BoardParallelTaskConfig loadBoardParallelTasks(JiraInjectables jiraInjectables, CustomFieldRegistry<CustomFieldConfig> customFields, ModelNode boardNode) {
        if (boardNode.hasDefined(PARALLEL_TASKS, FIELDS)) {
            ModelNode parallelTasks = boardNode.get(PARALLEL_TASKS, FIELDS);
            BoardParallelTaskConfig config = BoardParallelTaskConfig.load(jiraInjectables, customFields, parallelTasks);
            if (config.getConfigs().size() > 0) {
                return config;
            }
        }
        return null;
    }

    private static Map<String, NameAndColour> loadIssueTypes(IssueTypeManager issueTypeManager, List<ModelNode> typeNodes) {
        final Collection<IssueType> allTypes = issueTypeManager.getIssueTypes();
        Map<String, IssueType> types = new HashMap<>();
        for (IssueType type : allTypes) {
            types.put(type.getName(), type);
        }
        Map<String, NameAndColour> issueTypes = new LinkedHashMap<>();
        for (ModelNode typeNode : typeNodes) {
            if (!typeNode.hasDefined(NAME)) {
                throw new OverbaardValidationException("All \"issue-types\" must have a \"name\"");
            }
            if (!typeNode.hasDefined(COLOUR)) {
                throw new OverbaardValidationException("All \"issue-types\" must have a \"colour\"");
            }
            IssueType type = types.get(typeNode.get(NAME).asString());
            if (type == null) {
                throw new OverbaardValidationException(typeNode.get(NAME).asString() + " is not a known issue type in this Jira instance");
            }
            issueTypes.put(type.getName(), new NameAndColour(type.getName(), typeNode.get(COLOUR).asString()));
        }
        return issueTypes;
    }

    private static Map<String, NameAndColour> loadPriorities(PriorityManager priorityManager, List<ModelNode> priorityNodes) {
        final Collection<Priority> allPriorities = priorityManager.getPriorities();
        Map<String, Priority> priorities = new HashMap<>();
        for (Priority priority : allPriorities) {
            priorities.put(priority.getName(), priority);
        }
        Map<String, NameAndColour> priorityMap = new LinkedHashMap<>();
        for (ModelNode priorityNode : priorityNodes) {
            if (!priorityNode.hasDefined(NAME)) {
                throw new OverbaardValidationException("All \"priorities\" must have a \"name\"");
            }
            if (!priorityNode.hasDefined(COLOUR)) {
                throw new OverbaardValidationException("All \"priorities\" must have a \"colour\"");
            }
            Priority priority = priorities.get(priorityNode.get(NAME).asString());
            if (priority == null) {
                throw new OverbaardValidationException(priorityNode.get(NAME).asString() + " is not a known priority name in this Jira instance");
            }

            priorityMap.put(priority.getName(), new NameAndColour(priority.getName(), priorityNode.get(COLOUR).asString()));
        }
        return priorityMap;
    }

    private void getIndexMap(Map<String, NameAndColour> original, Map<String, Integer> index, List<String> list) {
        for (String key : original.keySet()) {
            index.put(key, index.size());
            list.add(key);
        }
    }

    public String getOwningUserKey() {
        return owningUserKey;
    }

    public String getName() {
        return name;
    }

    public Collection<BoardProjectConfig> getBoardProjects() {
        return boardProjects.values();
    }

    public BoardProjectConfig getBoardProject(String projectCode) {
        return boardProjects.get(projectCode);
    }

    public LinkedProjectConfig getLinkedProjectConfig(String linkedProjectCode) {
        return linkedProjects.get(linkedProjectCode);
    }

    public CustomFieldConfig getCustomFieldObjectForJiraName(String jiraCustomFieldName) {
        return customFields.getForJiraName(jiraCustomFieldName);
    }

    public CustomFieldConfig getCustomFieldConfigForOverbaardName(String overbaardName) {
        return customFields.getForOverbaardName(overbaardName);
    }

    public CustomFieldConfig getCustomFieldConfigForJiraId(Long jiraId) {
        return customFields.getForJiraId(jiraId);
    }


    /**
     * Used to serialize the board for the view board view
     *
     * @param boardNode The node to serialize the board to
     */
    public void serializeModelNodeForBoard(ModelNode boardNode) {
        boardNode.get(RANK_CUSTOM_FIELD_ID).set(rankCustomFieldId);

        boardStates.toModelNodeForBoard(boardNode);

        ModelNode prioritiesNode = boardNode.get(PRIORITIES);
        prioritiesNode.setEmptyList();
        for (NameAndColour priority : priorities.values()) {
            priority.serialize(prioritiesNode);
        }

        ModelNode issueTypesNode = boardNode.get(ISSUE_TYPES);
        issueTypesNode.setEmptyList();
        for (NameAndColour issueType : issueTypes.values()) {
            issueType.serialize(issueTypesNode);
        }

        final ModelNode projects = boardNode.get(PROJECTS);

        final ModelNode main = projects.get(MAIN);
        main.setEmptyList();
        for (BoardProjectConfig project : boardProjects.values()) {
            main.add(project.serializeModelNodeForBoard());
        }
        final ModelNode linked = projects.get(LINKED);
        linked.setEmptyObject();
        for (LinkedProjectConfig project : linkedProjects.values()) {
            linked.get(project.getCode()).set(project.serializeModelNodeForBoard());
        }
    }

    /**
     * Used to serialize the board for the view/edit board config view
     */
    public ModelNode serializeModelNodeForConfig() {
        ModelNode boardNode = new ModelNode();
        boardNode.get(NAME).set(name);
        boardNode.get(CODE).set(code);

        boardStates.toModelNodeForConfig(boardNode);

        ModelNode prioritiesNode = boardNode.get(PRIORITIES).setEmptyList();
        for (NameAndColour priority : priorities.values()) {
            priority.serialize(prioritiesNode);
        }

        ModelNode issueTypesNode = boardNode.get(ISSUE_TYPES).setEmptyList();
        for (NameAndColour issueType : issueTypes.values()) {
            issueType.serialize(issueTypesNode);
        }

        if (customFields.hasConfigs()) {
            ModelNode customNode = boardNode.get(CUSTOM);
            for (CustomFieldConfig cfg : customFields.values()) {
                customNode.add(cfg.serializeForConfig());
            }
        }

        if (parallelTaskConfig != null) {
            ModelNode parallelTaskFieldsNode = boardNode.get(PARALLEL_TASKS, FIELDS);
            parallelTaskFieldsNode.set(parallelTaskConfig.serializeForConfig());
        }

        final ModelNode projectsNode = boardNode.get(PROJECTS);
        projectsNode.setEmptyList();
        for (BoardProjectConfig project : boardProjects.values()) {
            projectsNode.add(project.serializeModelNodeForConfig());
        }

        final ModelNode linkedProjectsNode = boardNode.get(LINKED_PROJECTS);
        linkedProjectsNode.setEmptyObject();
        for (LinkedProjectConfig project : linkedProjects.values()) {
            linkedProjectsNode.get(project.getCode()).set(project.serializeModelNodeForConfig());
        }
        return boardNode;
    }

    public Integer getIssueTypeIndex(String name) {
        return issueTypeIndex.get(name);
    }

    public Integer getPriorityIndex(String name) {
        return priorityIndex.get(name);
    }

    public int getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public List<String> getStateNames() {
        return boardStates.getStateNames();
    }

    public boolean isBacklogState(int stateIndex) {
        return boardStates.isBacklogState(stateIndex);
    }

    public boolean isDoneState(int boardStateIndex) {
        return boardStates.isDoneState(boardStateIndex);
    }

    public String getIssueTypeName(int issueTypeIndex) {
        return issueTypeNames.get(issueTypeIndex);
    }

    public String getPriorityName(int priorityIndex) {
        return priorityNames.get(priorityIndex);
    }

    public Map<String, String> getStateHelpTexts() {
        return boardStates.getStateHelpTexts();
    }

    public Set<CustomFieldConfig> getCustomFieldConfigs() {
        if (customFields.size() == 0) {
            return Collections.emptySet();
        } else {
            return new HashSet<>(customFields.values());
        }
    }
}
