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
import org.osgi.framework.BundleReference;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.CustomFieldRegistry;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskGroupPosition;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

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
    private final Map<Long, BulkLoadContext<?>> customFieldContexts = new HashMap<>();
    private final Map<Long, ParallelTaskCustomFieldConfig> parallelTaskFields;
    private final List<Long> ids = new ArrayList<>();
    private final Map<Long, String> issues = new HashMap<>();
    private final Map<Long, Issue.Builder> builders = new HashMap<>();
    private boolean finished = false;

    public BulkIssueLoadStrategy(BoardProject.Builder project) {
        this.project = project;
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

    static BulkIssueLoadStrategy create(BoardProject.Builder project) {
        if (project.getConfig().getCustomFieldNames().size() == 0 && project.getConfig().getInternalAdvanced().getParallelTaskGroupsConfig() == null) {
            //There are no custom fields or parallel tasks so we are not needed
            return null;
        }
        final ClassLoader cl = RawSqlLoader.class.getClassLoader();
        if (cl instanceof BundleReference) {
            return new BulkIssueLoadStrategy(project);
        }
        //We are running in a unit test, so we don't use this strategy (see class javadoc)
        return null;

    }

    @Override
    public void handle(com.atlassian.jira.issue.Issue issue, Issue.Builder builder) {
        ids.add(issue.getId());
        issues.put(issue.getId(), issue.getKey());
        builders.put(issue.getId(), builder);
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
        final List<Long> idBatch = new ArrayList<>();
        for (int i = 0 ; i < ids.size() ; i++) {
            idBatch.add(ids.get(i));
            if (idBatch.size() == BATCH_SIZE) {
                loadDataForBatch(sqlProcessor, idBatch);
                idBatch.clear();
            }
        }
        if (idBatch.size() > 0) {
            loadDataForBatch(sqlProcessor, idBatch);
        }
    }

    private void loadDataForBatch(SQLProcessor sqlProcessor, List<Long> idBatch) {
        final String sql = createSql(idBatch);

        try (final ResultSet rs = sqlProcessor.executeQuery(sql)){
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
            SortedParallelTaskFieldOptions options =
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

    private String createSql(List<Long> idBatch) {
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
        sb.append("j.id in (");
        first = true;
        for (Long issueId : ids) {
            if (first) {
                first = false;
            } else {
                sb.append(", ");
            }
            sb.append(issueId.toString());
        }
        sb.append(")");

        final String sql = sb.toString();
        OverbaardLogger.LOGGER.debug("SQL query: {}", sql);
        return sql;
    }

}
