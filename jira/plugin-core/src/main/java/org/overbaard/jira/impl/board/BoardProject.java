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
package org.overbaard.jira.impl.board;

import static org.overbaard.jira.impl.Constants.KEY;
import static org.overbaard.jira.impl.Constants.NAME;
import static org.overbaard.jira.impl.Constants.OVERRIDES;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.CustomFieldOptions;
import org.overbaard.jira.api.NextRankedIssueUtil;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.api.ProjectCustomFieldOptionsLoader;
import org.overbaard.jira.api.adapter.JiraApiAdapterFactory;
import org.overbaard.jira.api.adapter.spi.SearchResultsAdapter;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.JiraInjectables;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.BoardProjectStateMapper;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.LinkedProjectConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskGroupPosition;
import org.overbaard.jira.impl.config.ProjectParallelTaskConfig;
import org.overbaard.jira.impl.util.IndexedMap;

import com.atlassian.jira.bc.issue.search.SearchService;
import com.atlassian.jira.bc.project.component.ProjectComponent;
import com.atlassian.jira.issue.CustomFieldManager;
import com.atlassian.jira.issue.link.IssueLinkManager;
import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.issue.search.SearchResults;
import com.atlassian.jira.jql.builder.JqlClauseBuilder;
import com.atlassian.jira.jql.builder.JqlQueryBuilder;
import com.atlassian.jira.permission.ProjectPermissions;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.project.version.Version;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.Consumer;
import com.atlassian.jira.web.bean.PagerFilter;
import com.atlassian.query.Query;
import com.atlassian.query.clause.Clause;
import com.atlassian.query.order.SortOrder;

/**
 * The data for a board project, i.e. a project whose issues should appear as cards on the board.
 *
 * @author Kabir Khan
 */
public class BoardProject {

    private volatile Board board;
    private final BoardProjectConfig projectConfig;
    private final IndexedMap<String, Epic> epics;
    private final List<String> rankedIssueKeys;
    private final ParallelTaskOptions parallelTaskOptions;

    private BoardProject(BoardProjectConfig projectConfig, IndexedMap<String, Epic> epics, List<String> rankedIssueKeys, ParallelTaskOptions parallelTaskOptions) {
        this.projectConfig = projectConfig;
        this.epics = epics != null ? epics : new IndexedMap<>(Collections.emptyMap());
        this.rankedIssueKeys = rankedIssueKeys;
        this.parallelTaskOptions = parallelTaskOptions;
    }

    void setBoard(Board board) {
        this.board = board;
    }

    int getAssigneeIndex(Assignee assignee) {
        return board.getAssigneeIndex(assignee);
    }

    int getComponentIndex(MultiSelectNameOnlyValue.Component component) {
        return board.getComponentIndex(component);
    }

    int getLabelIndex(MultiSelectNameOnlyValue.Label label) {
        return board.getLabelIndex(label);
    }

    int getFixVersionIndex(MultiSelectNameOnlyValue.FixVersion fixVersion) {
        return board.getFixVersionIndex(fixVersion);
    }

    public int getCustomFieldValueIndex(CustomFieldValue customFieldValue) {
        return board.getCustomFieldIndex(customFieldValue);
    }

    public List<String> getRankedIssueKeys() {
        return rankedIssueKeys;
    }

    void serialize(JiraInjectables jiraInjectables, Board board, ModelNode parent, ApplicationUser user, boolean backlog) {
        //Whether the user can rank issues or not
        parent.get(Constants.RANK).set(hasRankPermission(user, jiraInjectables.getProjectManager(), jiraInjectables.getPermissionManager()));

        ModelNode ranked = new ModelNode();
        ranked.setEmptyList();
        for (String key : rankedIssueKeys) {
            ranked.add(key);
        }
        parent.get(Constants.RANKED).set(ranked);

        if (parallelTaskOptions.getInternalAdvanced().getOptionsForProject().size() > 0) {
            ModelNode parallelTasks = parent.get(Constants.PARALLEL_TASKS).setEmptyList();
            for (ProjectParallelTaskConfig group : this.projectConfig.getInternalAdvanced().getParallelTaskGroupsConfig().getGroups()) {
                ModelNode groupNode = new ModelNode().setEmptyList();
                for (ParallelTaskCustomFieldConfig cfg : group.getConfigs().values()) {
                    SortedFieldOptions.ParallelTasks options = parallelTaskOptions.getInternalAdvanced().getOptionsForProject().get(cfg.getName());
                    options.serialize(groupNode);
                }
                parallelTasks.add(groupNode);
            }
        }
        ModelNode overrides = BoardProjectIssueTypeOverrideSerializer.create(
                projectConfig.getIssueTypeOverrideConfig(),
                projectConfig,
                parallelTaskOptions).serialize();
        if (overrides.isDefined()) {
            parent.get(OVERRIDES).set(overrides);
        }
    }

    ModelNode serializeEpics() {
        if (epics.size() > 0) {
            ModelNode epicsNode = new ModelNode();
            epicsNode.setEmptyList();
            for (Epic epic : epics.values()) {
                ModelNode epicNode = new ModelNode();
                epicNode.get(KEY).set(epic.getKey());
                epicNode.get(NAME).set(epic.getName());
                epicsNode.add(epicNode);
            }
            return epicsNode;
        }
        return null;
    }

    static Builder builder(JiraInjectables jiraInjectables, ProjectCustomFieldOptionsLoader projectCustomFieldOptionsLoader, Board.Builder builder, BoardProjectConfig projectConfig,
                           ApplicationUser boardOwner) {
        ParallelTaskOptions parallelTaskOptions =
                projectCustomFieldOptionsLoader.loadParallelTaskOptions(jiraInjectables, builder.getConfig(), projectConfig);
        CustomFieldOptions customFieldOptions =
                projectCustomFieldOptionsLoader.loadCustomFieldOptions(jiraInjectables, builder.getConfig(), projectConfig);

        return new Builder(jiraInjectables, builder, projectConfig, boardOwner, parallelTaskOptions, customFieldOptions);
    }

    static LinkedProjectContext linkedProjectContext(Board.Accessor board, LinkedProjectConfig linkedProjectConfig) {
        return new LinkedProjectContext(board, linkedProjectConfig);
    }

    public BoardProject copyAndDeleteIssue(Issue deleteIssue) throws SearchException {
        Updater updater = new Updater(null, null, null, this, null);
        updater.deleteIssue(deleteIssue);
        return updater.build();
    }

    public Updater updater(JiraInjectables jiraInjectables, NextRankedIssueUtil nextRankedIssueUtil, Board.Updater boardUpdater,
                           ApplicationUser boardOwner) {
        return new Updater(jiraInjectables, nextRankedIssueUtil, boardUpdater, this, boardOwner);
    }

    public boolean isBacklogState(String issueType, String state) {
        return projectConfig.getProjectStatesLinks(issueType).isBacklogState(state);
    }

    public boolean isDoneState(String issueType, String state) {
        return projectConfig.getProjectStatesLinks(issueType).isDoneState(state);
    }

    public String getCode() {
        return projectConfig.getCode();
    }

    public ParallelTaskOptions getParallelTaskOptions() {
        return parallelTaskOptions;
    }

    private boolean hasRankPermission(ApplicationUser user, ProjectManager projectManager, PermissionManager permissionManager) {
        Project project = projectManager.getProjectByCurrentKey(projectConfig.getCode());
        if (!permissionManager.hasPermission(ProjectPermissions.SCHEDULE_ISSUES, project, user)) {
            return false;
        }
        return true;
    }

    public static Query initialiseQuery(BoardProjectConfig projectConfig, ApplicationUser boardOwner,
                                        SearchService searchService, Consumer<JqlQueryBuilder> queryAddition) {
        JqlQueryBuilder queryBuilder = JqlQueryBuilder.newBuilder();

        addJqlStateFiltering(projectConfig, queryBuilder);

        queryBuilder.orderBy().addSortForFieldName("Rank", SortOrder.ASC, true);
        if (projectConfig.getQueryFilter() != null) {
            final SearchService.ParseResult parseResult = searchService.parseQuery(
                    boardOwner,
                    "(" + projectConfig.getQueryFilter() + ")");
            if (!parseResult.isValid()) {
                throw new RuntimeException("The query-filter for " + projectConfig.getCode() + ": '" + projectConfig.getQueryFilter() + "' could not be parsed");
            }
            queryBuilder = JqlQueryBuilder.newBuilder(queryBuilder.buildQuery());
            final Clause clause =  JqlQueryBuilder.newClauseBuilder(parseResult.getQuery()).buildClause();
            queryBuilder.where().and().addClause(clause);
        }

        if (queryAddition != null) {
            queryAddition.consume(queryBuilder);
        }

        return queryBuilder.buildQuery();
    }

    private static void addJqlStateFiltering(BoardProjectConfig projectConfig, JqlQueryBuilder queryBuilder) {

        // Process the overrides
        Map<String, Set<String>> issueOverrideDoneStateNames = new HashMap<>();
        for (Map.Entry<String, BoardProjectStateMapper> entry :
                projectConfig.getInternalAdvanced().getIssueTypeStateLinksOverrides().entrySet()) {
            issueOverrideDoneStateNames.put(entry.getKey(), entry.getValue().getOwnDoneStateNames());
        }

        //Add the project
        JqlClauseBuilder clauseBuilder = queryBuilder.where();
        queryBuilder.where().project(projectConfig.getCode());


        // Do the outer bracket if we have issue overrides
        boolean hasIssueOverrides = issueOverrideDoneStateNames.size() > 0;
        if (hasIssueOverrides) {
            clauseBuilder.and().sub();
        }

        // Do the filtering by state names and issue types for the project non-overridden issue types
        boolean mainProjectHasOwnDoneStateNames =
                projectConfig.getInternalAdvanced().getProjectStateLinks().getOwnDoneStateNames().size() > 0;
        boolean firstClause = true;
        if (mainProjectHasOwnDoneStateNames || hasIssueOverrides) {
            if (!hasIssueOverrides) {
                clauseBuilder.and();
            }
            clauseBuilder.sub();
            if (mainProjectHasOwnDoneStateNames) {
                clauseBuilder.not().addStringCondition("status",
                        projectConfig.getInternalAdvanced().getProjectStateLinks().getOwnDoneStateNames());
                firstClause = false;
            }
            if (hasIssueOverrides) {
                if (!firstClause) {
                    clauseBuilder.and();
                }
                clauseBuilder.not().addStringCondition("type", issueOverrideDoneStateNames.keySet());
            }

            clauseBuilder.endsub();
        }

        // Now do the overrides
        for (Map.Entry<String, Set<String>> override : issueOverrideDoneStateNames.entrySet()) {
            clauseBuilder.or();
            Set<String> doneStateNames = override.getValue();
            clauseBuilder.sub();
            clauseBuilder.addStringCondition("type", override.getKey());
            if (doneStateNames.size() > 0) {
                clauseBuilder.and();
                clauseBuilder.not().addStringCondition("status",
                        projectConfig.getInternalAdvanced().getProjectStateLinks().getOwnDoneStateNames());
            }
            clauseBuilder.endsub();
        }

        if (hasIssueOverrides) {
            clauseBuilder.endsub();
        }
    }

    public abstract static class Accessor {
        protected final JiraInjectables jiraInjectables;
        protected final Board.Accessor board;
        protected final BoardProjectConfig projectConfig;
        protected final ApplicationUser boardOwner;
        protected static final SearchResultsAdapter SEARCH_RESULTS_ADAPTER = JiraApiAdapterFactory.getAdapter().getSearchResultsAdapter();


        public Accessor(JiraInjectables jiraInjectables, Board.Accessor board, BoardProjectConfig projectConfig, ApplicationUser boardOwner) {
            this.jiraInjectables = jiraInjectables;
            this.board = board;
            this.projectConfig = projectConfig;
            this.boardOwner = boardOwner;
        }

        BoardProjectConfig getConfig() {
            return projectConfig;
        }

        Integer getPriorityIndexRecordingMissing(String issueKey, String priorityName) {
            return board.getPriorityIndexRecordingMissing(issueKey, priorityName);
        }

        Integer getIssueTypeIndexRecordingMissing(String issueKey, String issueTypeName) {
            return board.getIssueTypeIndexRecordingMissing(issueKey, issueTypeName);
        }

        Integer getStateIndexRecordingMissing(String issueKey, String issueType, String stateName) {
            final Integer index = projectConfig.getProjectStatesLinks(issueType).getStateIndex(stateName);
            if (index == null) {
                board.addMissingState(issueKey, stateName);
            } else {
//                if (!projectConfig.isOwner()) {
//                    Integer ownerStateIndex = null;
//                    String ownerState = projectConfig.mapOwnStateOntoBoardState(stateName);
//                    if (ownerState != null) {
//                        ownerStateIndex = board.getOwningProject().getStateIndex(ownerState);
//                    }
//                    if (ownerStateIndex == null) {
//                        //This was not mapped to a valid owner state so report the problem
//                        board.addMissingState(issueKey, ownerState != null ? ownerState : stateName);
//                        return null;
//                    }
//                    //Do not return the owner state index here although all was fine. The calculation of the columns
//                    //depends on everything using their own state index.
//                }
            }
            return index;
        }

        IssueLinkManager getIssueLinkManager() {
            return jiraInjectables.getIssueLinkManager();
        }

        Assignee getAssignee(ApplicationUser assigneeUser) {
            return board.getAssignee(assigneeUser);
        }

        CustomFieldManager getCustomFieldManager() {
            return jiraInjectables.getCustomFieldManager();
        }

        public String getCode() {
            return projectConfig.getCode();
        }

        public LinkedProjectContext getLinkedProjectContext(String linkedProjectCode) {
            return board.getLinkedProjectContext(linkedProjectCode);
        }

        public Set<MultiSelectNameOnlyValue.Component> getComponents(Collection<ProjectComponent> componentObjects) {
            return board.getComponents(componentObjects);
        }

        public Set<MultiSelectNameOnlyValue.Label> getLabels(Set<com.atlassian.jira.issue.label.Label> labels) {
            return board.getLabels(labels);
        }

        public Set<MultiSelectNameOnlyValue.FixVersion> getFixVersions(Collection<Version> fixVersions) {
            return board.getFixVersions(fixVersions);
        }

        public Board.Accessor getBoard() {
            return board;
        }

        public CustomFieldValue getCustomFieldValue(CustomFieldConfig customField, Object fieldValue) {
            return board.getCustomFieldValue(customField, fieldValue);
        }

        public CustomFieldValue getCustomFieldValue(CustomFieldConfig customField, String key) {
            return board.getCustomFieldValue(customField, key);
        }

        public JiraInjectables getJiraInjectables() {
            return jiraInjectables;
        }

        abstract ParallelTaskOptions getParallelTaskOptions();

        abstract Integer getEpicIndex(String epicKey);

        abstract Epic getEpic(String epicKey);

        public abstract Epic getEpicForIssue(String parentKey);

        public abstract void collectAllEpics(Map<String, Epic> map);

        public abstract void setOrderedEpics(IndexedMap<String, Epic> orderedEpics);
    }

    /**
     * Used to load a project when creating a new board
     */
    public static class Builder extends Accessor {
        private final List<String> rankedIssueKeys = new ArrayList<>();
        private final Map<String, List<String>> issueKeysByState = new HashMap<>();
        private final ParallelTaskOptions parallelTaskOptions;
        private final CustomFieldOptions customFieldOptions;
        private IndexedMap<String, Epic> orderedEpics;


        private Builder(JiraInjectables jiraInjectables, Board.Accessor board, BoardProjectConfig projectConfig,
                        ApplicationUser boardOwner, ParallelTaskOptions parallelTaskOptions, CustomFieldOptions customFieldOptions) {
            super(jiraInjectables, board, projectConfig, boardOwner);
            this.parallelTaskOptions = parallelTaskOptions;
            this.customFieldOptions = customFieldOptions;
        }

        Builder addIssue(String state, Issue issue) {
            final List<String> issueKeys = issueKeysByState.computeIfAbsent(state, l -> new ArrayList<>());
            issueKeys.add(issue.getKey());
            board.addIssue(issue);
            return this;
        }


        public void setOrderedEpics(IndexedMap<String, Epic> orderedEpics) {
            this.orderedEpics = orderedEpics;
        }

        @Override
        public Integer getEpicIndex(String epicKey) {
            if (this.orderedEpics == null) {
                return null;
            }
            return this.orderedEpics.getIndex(epicKey);
        }

        @Override
        Epic getEpic(String epicKey) {
            if (this.orderedEpics == null) {
                return null;
            }
            return this.orderedEpics.get(epicKey);
        }

        @Override
        public Epic getEpicForIssue(String parentKey) {
            return null;
        }

        @Override
        public void collectAllEpics(Map<String, Epic> map) {
            // For the current usage, there will be no epics here
        }

        public ParallelTaskOptions getParallelTaskOptions() {
            return parallelTaskOptions;
        }

        public CustomFieldOptions getCustomFieldOptions() {
            return customFieldOptions;
        }

        void load() throws SearchException {
            final SearchService searchService = jiraInjectables.getSearchService();
            final Query query = initialiseQuery(projectConfig, boardOwner, searchService, null);

            SearchResults searchResults =
                        searchService.search(boardOwner, query, PagerFilter.getUnlimitedFilter());


            /*System.out.println("Hardcoding lazy load - REMOVE THIS");
            IssueLoadStrategy issueLoadStrategy = new Issue.LazyLoadStrategy(this);*/
            final IssueLoadStrategy issueLoadStrategy = IssueLoadStrategy.Factory.create(this);

            List<Issue.Builder> issueBuilders = new ArrayList<>();
            for (com.atlassian.jira.issue.Issue jiraIssue : SEARCH_RESULTS_ADAPTER.getIssueResults(searchResults)) {
                Issue.Builder issueBuilder = Issue.builder(this, issueLoadStrategy);
                issueBuilder.load(jiraIssue);
                issueBuilders.add(issueBuilder);
                if (!board.getBlacklist().isBlackListed(jiraIssue.getKey())) {
                    rankedIssueKeys.add(jiraIssue.getKey());
                }
            }
            issueBuilders.forEach(issueBuilder -> {
                Issue issue = issueBuilder.build();
                if (issue != null) {
                    addIssue(issue.getState(), issue);
                }});
        }

        BoardProject build() {
            //Add all the pre-determined custom field options to the list in the board
            for (SortedFieldOptions.CustomFields fieldOptions : customFieldOptions.getCustomFieldsOptions().values()) {
                for (CustomFieldValue value : fieldOptions.sortedFields.values()) {
                    board.addBulkLoadedCustomFieldValue(fieldOptions.getConfig(), value);

                }
            }

            return new BoardProject(
                    projectConfig,
                    orderedEpics, Collections.unmodifiableList(rankedIssueKeys),
                    parallelTaskOptions);
        }

        public void addBulkLoadedCustomFieldValue(CustomFieldConfig customFieldConfig, CustomFieldValue value) {
            board.addBulkLoadedCustomFieldValue(customFieldConfig, value);
        }
    }

    /**
     * Used to update an existing board
     */
    static class Updater extends Accessor {
        private final BoardProject project;
        private final NextRankedIssueUtil nextRankedIssueUtil;
        private Issue newIssue;
        private List<String> rankedIssueKeys;
        private IndexedMap<String, Epic> orderedEpics;


        Updater(JiraInjectables jiraInjectables, NextRankedIssueUtil nextRankedIssueUtil, Board.Accessor board, BoardProject project,
                       ApplicationUser boardOwner) {
            super(jiraInjectables, board, project.projectConfig, boardOwner);
            this.nextRankedIssueUtil = nextRankedIssueUtil;
            OverbaardLogger.LOGGER.debug("BoardProject.Updater - init {}", project.projectConfig.getCode());
            this.project = project;
        }

        @Override
        public Integer getEpicIndex(String epicKey) {
            if (project.projectConfig.isEnableEpics()) {
                IndexedMap<String, Epic> epics = orderedEpics != null ? orderedEpics : project.epics;
                if (epics != null) {
                    return epics.getIndex(epicKey);
                }
            }
            return null;
        }

        @Override
        Epic getEpic(String epicKey) {
            if (project.projectConfig.isEnableEpics()) {
                IndexedMap<String, Epic> epics = orderedEpics != null ? orderedEpics : project.epics;
                if (epics != null) {
                    return epics.get(epicKey);
                }
            }
            return null;
        }

        @Override
        public Epic getEpicForIssue(String parentKey) {
            Issue issue = project.board.getIssue(parentKey);
            if (issue != null) {
                String epicKey = issue.getEpicKey();
                if (epicKey != null) {
                    return project.epics.get(epicKey);
                }
            }
            return null;
        }

        @Override
        public void collectAllEpics(Map<String, Epic> map) {
            if (project.projectConfig.isEnableEpics()) {
                IndexedMap<String, Epic> epics = orderedEpics != null ? orderedEpics : project.epics;
                if (epics != null) {
                    map.putAll(epics.map());
                }
            }
        }

        @Override
        public void setOrderedEpics(IndexedMap<String, Epic> orderedEpics) {
            this.orderedEpics = orderedEpics;
        }

        Issue createIssue(String issueKey, String issueType, String priority, String summary,
                          Assignee assignee, Set<MultiSelectNameOnlyValue.Component> issueComponents,
                          Set<MultiSelectNameOnlyValue.Label> labels, Set<MultiSelectNameOnlyValue.FixVersion> fixVersions, String state,
                          Map<String, CustomFieldValue> customFieldValues,
                          Map<ParallelTaskGroupPosition, Integer> parallelTaskGroupValues) throws SearchException {
            OverbaardLogger.LOGGER.debug("BoardProject.Updater.createIssue - {}", issueKey);
            newIssue = Issue.createForCreateEvent(
                    this, issueKey, state, summary, issueType, priority,
                    assignee, issueComponents, labels, fixVersions, customFieldValues,
                    parallelTaskGroupValues);
            OverbaardLogger.LOGGER.debug("BoardProject.Updater.createIssue - created {}", newIssue);

            if (newIssue != null) {
                rankedIssueKeys = rankIssues(issueKey);
            }
            return newIssue;
        }

        Issue updateIssue(Issue existing, String issueType, String priority, String summary,
                          Assignee issueAssignee, Set<MultiSelectNameOnlyValue.Component> issueComponents,
                          Set<MultiSelectNameOnlyValue.Label> labels, Set<MultiSelectNameOnlyValue.FixVersion> fixVersions, boolean reranked,
                          String state, Map<String, CustomFieldValue> customFieldValues,
                          Map<ParallelTaskGroupPosition, Integer> parallelTaskGroupValues) throws SearchException {
            OverbaardLogger.LOGGER.debug("BoardProject.Updater.updateIssue - {}, rankOrStateChanged: {}", existing.getKey(), reranked);
            newIssue = existing.copyForUpdateEvent(this, existing, issueType, priority,
                    summary, issueAssignee, issueComponents, labels, fixVersions,
                    state, customFieldValues, parallelTaskGroupValues);
            OverbaardLogger.LOGGER.debug("BoardProject.Updater - updated issue {} to {}. Reranked: {}", existing, newIssue, reranked);
            if (reranked) {
                rankedIssueKeys = rankIssues(existing.getKey());
            }
            return newIssue;
        }

        void deleteIssue(Issue issue) {
            rankedIssueKeys = new ArrayList<>(project.rankedIssueKeys);
            rankedIssueKeys.remove(issue.getKey());
        }

        public ParallelTaskOptions getParallelTaskOptions() {
            return project.getParallelTaskOptions();
        }


        List<String> rankIssues(String issueKey) throws SearchException {
            String nextIssueKey = nextRankedIssueUtil.findNextRankedIssue(this.projectConfig, boardOwner, issueKey);
            //If the next issue is blacklisted, keep searching until we find the next valid one
            while (nextIssueKey != null && board.getBlacklist().isBlackListed(nextIssueKey)) {
                nextIssueKey = nextRankedIssueUtil.findNextRankedIssue(this.projectConfig, boardOwner, nextIssueKey);
            }
            final List<String> newRankedKeys = new ArrayList<>();
            if (nextIssueKey == null) {
                //Add it at the end
                project.rankedIssueKeys.forEach(key -> {
                    if (!key.equals(issueKey)) {
                        //Don't copy the one we are moving to the end
                        newRankedKeys.add(key);
                    }
                });
                newRankedKeys.add(issueKey);
            } else {
                final String nextKey = nextIssueKey;
                //Remove it from the middle and add it at the end
                project.rankedIssueKeys.forEach(key -> {
                    if (key.equals(nextKey)) {
                        newRankedKeys.add(issueKey);
                    }
                    if (!key.equals(issueKey)) {
                        newRankedKeys.add(key);
                    }
                });
            }
            return new ArrayList<>(newRankedKeys);
        }

        Issue loadSingleIssue(String issueKey) throws SearchException {
            OverbaardLogger.LOGGER.debug("BoardProject.Updater.loadSingleIssue - {}", issueKey);
            JqlQueryBuilder queryBuilder = JqlQueryBuilder.newBuilder();
            queryBuilder.where().issue(issueKey);

            final SearchService searchService = jiraInjectables.getSearchService();

            SearchResults searchResults =
                    searchService.search(boardOwner, queryBuilder.buildQuery(), PagerFilter.getUnlimitedFilter());

            List<com.atlassian.jira.issue.Issue> issues = SEARCH_RESULTS_ADAPTER.getIssueResults(searchResults);
            if (issues.size() == 0) {
                OverbaardLogger.LOGGER.debug("BoardProject.Updater.loadSingleIssue - no issue found");
                return null;
            }
            Issue.Builder issueBuilder = Issue.builder(this, null);
            issueBuilder.load(issues.get(0));
            newIssue = issueBuilder.build();
            OverbaardLogger.LOGGER.debug("BoardProject.Updater.loadSingleIssue - found {}", newIssue);
            rankedIssueKeys = rankIssues(issueKey);
            return newIssue;
        }

        BoardProject build() throws SearchException {

            //Update the ranked issue list if a rerank was done
            List<String> rankedIssueKeys =
                    this.rankedIssueKeys != null ?
                            Collections.unmodifiableList(this.rankedIssueKeys) : project.rankedIssueKeys;
            IndexedMap<String, Epic> epics = orderedEpics != null ? orderedEpics : project.epics;
            return new BoardProject(projectConfig, project.epics, rankedIssueKeys, project.parallelTaskOptions);
        }
    }

    static class LinkedProjectContext {

        private final Board.Accessor board;
        private final LinkedProjectConfig linkedProjectConfig;

        LinkedProjectContext(Board.Accessor board, LinkedProjectConfig linkedProjectConfig) {
            this.board = board;
            this.linkedProjectConfig = linkedProjectConfig;
        }

        public LinkedProjectConfig getConfig() {
            return linkedProjectConfig;
        }

        Integer getStateIndexRecordingMissing(String issueKey, String issueType, String stateName) {
            final Integer index = linkedProjectConfig.getProjectStatesLinks(issueType).getStateIndex(stateName);
            if (index == null) {
                board.addMissingState(issueKey, stateName);
            }
            return index;
        }

        public String getCode() {
            return linkedProjectConfig.getCode();
        }
    }
}
