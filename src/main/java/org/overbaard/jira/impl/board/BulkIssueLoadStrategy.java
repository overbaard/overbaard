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

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.ofbiz.core.entity.jdbc.SQLProcessor;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskGroupPosition;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;
import org.overbaard.jira.impl.util.IndexedMap;

/**
 * <p>Bulk loads up things like custom fields using a direct sql query.</p>
 * <p>Normally if using the Jira provided classes, this is done lazily for each issue, and is
 * fine when we are handling events to create or update entities.</p>
 * <p>But is not suitable for loading the full board, since the lazy loading results in an extra sql
 * query behind the scenes for every single custom field, for every single issue. So, when loading the full board
 * we instead do a bulk load to avoid this performance overhead.</p>
 * <p>For unit tests we currently use the lazy loading mechanism to load the custom fields, this is mainly
 * to avoid having to set up the mocks at present.</p>
 *
 * @author Kabir Khan
 */
class BulkIssueLoadStrategy implements IssueLoadStrategy {

    //The size of the batch of issues to do a bulk load for
    private static final int BATCH_SIZE = 100;

    private static final String dataSourceName = "defaultDS";
    private final BoardProject.Builder project;
    private final boolean customFieldsOrParallelTasks;
    private final Map<Long, BulkLoadContext<?>> customFieldContexts = new HashMap<>();
    private final Map<Long, ParallelTaskCustomFieldConfig> parallelTaskFields;
    private final List<Long> ids = new ArrayList<>();
    private final Map<Long, String> issues = new HashMap<>();
    private final Map<Long, Issue.Builder> builders = new HashMap<>();
    private final Map<String, Issue.Builder> buildersByKey = new HashMap<>();
    private final Map<String, String> childToParentIssueKeys = new HashMap<>();
    private final Map<String, String> issuesToEpics = new HashMap<>();
    private final Map<String, Epic> unsortedEpics = new HashMap<>();
    private boolean finished = false;

    public BulkIssueLoadStrategy(
            BoardProject.Builder project,
            boolean customFieldsOrParallelTasks) {
        this.project = project;
        this.customFieldsOrParallelTasks = customFieldsOrParallelTasks;
        for (String cfName : project.getConfig().getCustomFieldNames()) {
            //These do not have the values loaded on project load. Rather values referenced by issues are what is used to
            // populate the 'lookup table'. To avoid repeatedly querying Jira for what the ids represent, use the caching
            // BulkLoadContext..
            CustomFieldConfig customFieldConfig =
                    project.getBoard().getConfig().getCustomFieldConfigForOverbaardName(cfName);
            CustomFieldUtil customFieldUtil = CustomFieldUtil.getUtil(customFieldConfig);
            BulkLoadContext<?> ctx =
                    customFieldUtil.createBulkLoadContext(project, customFieldConfig);
            customFieldContexts.put(customFieldConfig.getId(), ctx);
        }

        parallelTaskFields = project.getConfig().getAllParallelTaskCustomFieldConfigs();
    }

    @Override
    public void handle(com.atlassian.jira.issue.Issue issue, Issue.Builder builder) {
        ids.add(issue.getId());
        issues.put(issue.getId(), issue.getKey());
        builders.put(issue.getId(), builder);
        buildersByKey.put(issue.getKey(), builder);
    }

    @Override
    public void finish() {
        if (finished) {
            return;
        }
        finished = true;
        final SQLProcessor sqlProcessor = new SQLProcessor(dataSourceName);
        try {
            bulkLoadData(sqlProcessor);
        } finally {
            try {
                sqlProcessor.close();
            } catch (Exception ignore) {

            }
        }
    }

    private void bulkLoadData(SQLProcessor sqlProcessor) {
        // Load up the ids of the link types, we'll need those for figuring out the sub-tasks and the epic links
        String loadIdsSql = "select id, linkname " +
                "from issuelinktype " +
                "where linkname = 'jira_subtask_link' " +
                "or linkname = 'Epic-Story Link' " +
                "order by linkname";
        long subtaskLinkId = -1;
        long epicLinkId = -1;
        try (ResultSet rs = sqlProcessor.executeQuery(loadIdsSql)){
            while (rs.next()) {
                Long id = rs.getLong(1);
                String name = rs.getString(2);
                if (name.equals("jira_subtask_link")) {
                    subtaskLinkId = id;
                } else {
                    epicLinkId = id;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }


        final List<Long> idBatch = new ArrayList<>();
        for (int i = 0 ; i < ids.size() ; i++) {
            idBatch.add(ids.get(i));
            if (idBatch.size() == BATCH_SIZE) {
                loadBatch(sqlProcessor, idBatch, subtaskLinkId, epicLinkId);
                idBatch.clear();
            }
        }
        if (idBatch.size() > 0) {
            loadBatch(sqlProcessor, idBatch, subtaskLinkId, epicLinkId);
        }

        processParentTasksAndEpics();

        IndexedMap<String, Epic> orderedEpics =
                getEpicsInRankOrder(
                        project.getJiraInjectables().getSearchService(),
                        project.getBoard().getBoardOwner(),
                        unsortedEpics);
        project.setOrderedEpics(orderedEpics);
    }

    private void loadBatch(SQLProcessor sqlProcessor, List<Long> idBatch, long subtaskLinkId, long epicLinkId) {
        loadCustomFieldDataForBatch(sqlProcessor, idBatch);
        loadParentTasks(sqlProcessor, idBatch, subtaskLinkId);
        loadEpics(sqlProcessor, idBatch, epicLinkId);
    }

    private void loadCustomFieldDataForBatch(SQLProcessor sqlProcessor, List<Long> idBatch) {
        if (!customFieldsOrParallelTasks) {
            return;
        }
        final String sql = createLoadCustomFieldsSql(idBatch);

        try (ResultSet rs = sqlProcessor.executeQuery(sql)){
            while (rs.next()) {
                Long issueId = rs.getLong(1);
                Long customFieldId = rs.getLong(2);
                String stringValue = rs.getString(3);
                Long numValue = rs.getLong(4);
                String issueType = rs.getString(5);
                if (rs.wasNull()) {
                    numValue = null;
                }

                processCustomFieldValue(issueId, customFieldId, stringValue, numValue, issueType);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void processCustomFieldValue(Long issueId, Long customFieldId, String stringValue, Long numValue, String issueType) {
        OverbaardLogger.LOGGER.trace("Processing bulk issue {}. customFieldId:{}, stringValue:{}, numValue:{}",
                issueId, customFieldId, stringValue, numValue);
        Issue.Builder builder = builders.get(issueId);

        //The configuration validation ensures that a custom field id cannot be used for both custom fields and progress fields
        BulkLoadContext<?> bulkLoadContext = customFieldContexts.get(customFieldId);
        ParallelTaskCustomFieldConfig parallelTaskFieldConfig = bulkLoadContext == null ? parallelTaskFields.get(customFieldId) : null;

        if (bulkLoadContext != null) {
            CustomFieldValue value = bulkLoadContext.getCachedCustomFieldValue(stringValue, numValue);
            if (value == null) {
                value = bulkLoadContext.loadAndCacheCustomFieldValue(stringValue, numValue);
                //Add the loaded custom field value to board
                project.addBulkLoadedCustomFieldValue(bulkLoadContext.getConfig(), value);
            }
            //Add the custom field to the issue
            builder.addCustomFieldValue(value);
        } else if (parallelTaskFieldConfig != null) {

            ParallelTaskOptions parallelTaskOptions = project.getParallelTaskOptions();
            SortedFieldOptions.ParallelTasks options =
                    parallelTaskOptions.getOptions(issueType).get(parallelTaskFieldConfig.getName());
            ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = project.getConfig().getParallelTaskGroupsConfig(issueType);
            if (parallelTaskGroupsConfig == null || options == null) {
                // Issues may have values for custom fields configured as parallel tasks, but they
                // are not necessarily configured for all issue types
                return;
            }

            Integer optionIndex = options.getIndex(stringValue);
            if (optionIndex == null) {
                optionIndex = 0;
            }

            final ParallelTaskGroupPosition position = parallelTaskGroupsConfig.getPosition(parallelTaskFieldConfig.getName());
            builder.setParallelTaskFieldValue(position, optionIndex);
        }
    }

    private String createLoadCustomFieldsSql(List<Long> idBatch) {
        StringBuilder sb = new StringBuilder()
                .append("select j.id, cv.customfield, cv.stringvalue, cv.numbervalue, it.pname as type ")
                .append("from project p, jiraissue j, customfieldvalue cv, issuetype it ")
                .append("where ")
                .append("p.id=j.project and j.id=cv.issue and ")
                .append("j.issuetype=it.id and ")
                .append("p.pkey='" + project.getCode() + "' and ")
                .append("customfield in (");

        boolean first = true;
        for (Long cfId : customFieldContexts.keySet()) {
            if (first) {
                first = false;
            } else {
                sb.append(", ");
            }
            sb.append(cfId.toString());
        }
        if (parallelTaskFields.size() > 0) {
            for (Long cfId : parallelTaskFields.keySet()) {
                if (first) {
                    first = false;
                } else {
                    sb.append(", ");
                }
                sb.append(cfId.toString());
            }
        }
        sb.append(") and ");
        sb.append("j.id in " + createInIdsClause(idBatch));

        final String sql = sb.toString();
        OverbaardLogger.LOGGER.debug("SQL query: {}", sql);
        return sql;
    }

    private void loadParentTasks(SQLProcessor sqlProcessor, List<Long> idBatch, long subTaskLinkId) {
        StringBuilder sb = new StringBuilder()
                .append("SELECT ")
                .append("child.issueNum as issueNum, parentProject.pkey as parentProjectCode, parent.issueNum as parentNum ")
                .append("FROM ")
                .append("JiraIssue child, JiraIssue parent, Project childProject, Project parentProject, IssueLink il ")
                .append("WHERE ")
                .append("child.project = childProject.id and child.id = il.destination and ")
                .append("parent.id = il.source and parent.project = parentProject.id and ")
                .append("childProject.pkey = '" + project.getCode() + "' and ")
                .append("il.linktype = " + subTaskLinkId + " and ")
                .append("il.destination in " + createInIdsClause(idBatch));

        try (ResultSet rs = sqlProcessor.executeQuery(sb.toString())){
            while (rs.next()) {
                String childKey = project.getCode() + "-" + rs.getLong(1);
                String parentKey = rs.getString(2) + "-" + rs.getLong(3);
                childToParentIssueKeys.put(childKey, parentKey);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void loadEpics(SQLProcessor sqlProcessor, List<Long> idBatch, long epicLinkId) {
        if (!project.getConfig().isEnableEpics()) {
            return;
        }

        StringBuilder sb = new StringBuilder()
                .append("SELECT ")
                .append("issue.issueNum as issueNum, epicProject.pkey as epicProjectCode, ")
                .append("epic.issueNum as epicNum, cfv.stringvalue as summary ")
                .append("FROM ")
                .append("JiraIssue issue, JiraIssue epic, Project issueProject, ")
                .append("Project epicProject, IssueLink il, CustomFieldValue cfv ")
                .append("WHERE ")
                .append("issue.project = issueProject.id and issue.id = il.destination and ")
                .append("epic.id = il.source and\tepic.project = epicProject.id and cfv.issue = epic.id and ")
                .append("epicProject.pkey = '" + project.getCode() + "' and ")
                .append("il.linkType = " + epicLinkId + " and ")
                .append("cfv.customfield = " + project.getBoard().getConfig().getEpicSummaryCustomFieldId() + " and ")
                .append("il.destination in " + createInIdsClause(idBatch));

        try (ResultSet rs = sqlProcessor.executeQuery(sb.toString())){
            while (rs.next()) {
                String issueKey = project.getCode() + "-" + rs.getLong(1);
                String epicKey = rs.getString(2) + "-" + rs.getLong(3);
                String epicSummary = rs.getString(4);
                issuesToEpics.put(issueKey, epicKey);
                unsortedEpics.put(epicKey, new Epic(epicKey, epicSummary));
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    private String createInIdsClause(List<Long> idBatch) {
        StringBuilder sb = new StringBuilder("(");
        boolean first = true;
        for (Long issueId : ids) {
            if (first) {
                first = false;
            } else {
                sb.append(", ");
            }
            sb.append(issueId.toString());
        }
        sb.append(")");
        return sb.toString();
    }

    private void processParentTasksAndEpics() {
        final boolean epics = project.getConfig().isEnableEpics();
        if (epics) {
            for (Map.Entry<String, String> issueToEpic : issuesToEpics.entrySet()) {
                Issue.Builder builder = buildersByKey.get(issueToEpic.getKey());
                if (builder == null) {
                    OverbaardLogger.LOGGER.warn("Could not find a builder for " + issueToEpic.getKey() + " to set epic");
                    continue;
                }

                builder.setEpicKey(issueToEpic.getValue());
            }
        }

        for (Map.Entry<String, String> childToParent : childToParentIssueKeys.entrySet()) {
            final String childKey = childToParent.getKey();
            final String parentKey = childToParent.getValue();
            Issue.Builder builder = buildersByKey.get(childToParent.getKey());
            if (builder == null) {
                OverbaardLogger.LOGGER.warn("Could not find a builder for " + childKey + " to set parent");
                continue;
            }

            builder.setParentIssueKey(parentKey);
            if (epics) {
                final String epic = issuesToEpics.get(parentKey);
                if (epic != null) {
                    builder.setEpicKey(epic);
                }
            }
        }
    }
}
