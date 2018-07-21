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

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskGroupPosition;
import org.overbaard.jira.impl.config.ProjectParallelTaskConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.customfields.option.LazyLoadedOption;
import com.atlassian.jira.issue.fields.CustomField;

/**
 * @author Kabir Khan
 */
public class CustomFieldValue {

    private final String customFieldName;
    private final String key;
    private final String value;

    //Jira's event mechanism seems to use an empty string to unset custom fields
    public static final String UNSET_VALUE = "";

    protected CustomFieldValue(String customFieldName, String key, String value) {
        this.customFieldName = customFieldName;
        this.key = key;
        this.value = value;
    }

    static Map<String, CustomFieldValue> loadCustomFieldValues(final BoardProject.Accessor project, final Issue issue) {
        final List<String> customFieldNames = project.getConfig().getCustomFieldNames();
        if (customFieldNames.size() == 0) {
            return Collections.emptyMap();
        }

        final Map<String, CustomFieldValue> fields = new HashMap<>(customFieldNames.size());
        for (String customFieldName : customFieldNames) {
            CustomFieldConfig customFieldConfig = project.getBoard().getConfig().getCustomFieldConfigForOverbaardName(customFieldName);
            Object customFieldValue = issue.getCustomFieldValue(customFieldConfig.getJiraCustomField());
            if (customFieldValue == null) {
                continue;
            }
            final CustomFieldValue customField = project.getCustomFieldValue(customFieldConfig, customFieldValue);
            fields.put(customFieldName, customField);
        }
        return fields.size() > 0 ? fields : Collections.emptyMap();
    }

    static void loadParallelTaskValues(BoardProject.Accessor project, Issue issue, org.overbaard.jira.impl.board.Issue.Builder builder) {
        final String issueType = issue.getIssueType().getName();
        final ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = project.getConfig().getParallelTaskGroupsConfig(issueType);
        if (parallelTaskGroupsConfig == null) {
            return;
        }

        ParallelTaskOptions parallelTaskOptions = project.getParallelTaskOptions();
        for (Map.Entry<String, SortedParallelTaskFieldOptions> fieldEntry : parallelTaskOptions.getOptions(issueType).entrySet()) {
            CustomFieldConfig customFieldConfig = parallelTaskGroupsConfig.getConfigs().getForOverbaardName(fieldEntry.getKey());
            String value = getParallelTaskCustomFieldValue(issue, customFieldConfig.getJiraCustomField(), fieldEntry.getKey());
            if (value == null) {
                continue;
            }
            final int optionIndex = fieldEntry.getValue().getIndex(value);
            final ParallelTaskGroupPosition position = parallelTaskGroupsConfig.getPosition(fieldEntry.getKey());
            builder.setParallelTaskFieldValue(position, optionIndex);
        }
    }

    public static String getParallelTaskCustomFieldValue(Issue issue, CustomField customField, String fieldKey) {
        Object customFieldValue = issue.getCustomFieldValue(customField);
        if (customFieldValue == null) {
            return null;
        }
        //The type of this varies across instances?
        if (customFieldValue instanceof String) {
            return  (String)customFieldValue;
        } else if (customFieldValue instanceof LazyLoadedOption) {
            LazyLoadedOption option = (LazyLoadedOption)customFieldValue;
            return String.valueOf(option.getOptionId());
        } else {
            OverbaardLogger.LOGGER.warn("Unhandled field type " + customFieldValue.getClass());
        }
        return null;
    }

    static Map<String, CustomFieldValue> loadCustomFieldValues(final BoardProject.Accessor project, final Map<Long, String> customFieldValues) {
        final List<String> customFieldNames = project.getConfig().getCustomFieldNames();
        if (customFieldNames.size() == 0) {
            return Collections.emptyMap();
        }

        final Map<String, CustomFieldValue> fields = new HashMap<>(customFieldNames.size());
        for (String customFieldName : customFieldNames) {
            CustomFieldConfig customFieldConfig = project.getBoard().getConfig().getCustomFieldConfigForOverbaardName(customFieldName);
            if (customFieldConfig != null) {
                String value = customFieldValues.get(customFieldConfig.getId());

                if (value != null) {
                    final CustomFieldValue customFieldValue;
                    if (value.equals("")) {
                        customFieldValue = null;
                    } else {
                        customFieldValue =
                                project.getCustomFieldValue(customFieldConfig, value);
                    }
                    fields.put(customFieldName, customFieldValue);
                }
            }
        }
        return fields.size() > 0 ? fields : Collections.emptyMap();
    }

    static Map<ParallelTaskGroupPosition, Integer> loadParallelTaskGroupValues(
            final BoardProject.Accessor project, final Map<Long, String> updatedCustomFieldValues,
            final org.overbaard.jira.impl.board.Issue existingIssue, String newIssueType) {

        // For an update we generally only want to populate the fields that were set in the update,
        // while for a create we generally want to populate all the fields
        final boolean overwriteAllFields;
        final String issueType;
        if (existingIssue != null) {
            overwriteAllFields = false;
            issueType = newIssueType != null ? newIssueType : existingIssue.getIssueTypeName();
        } else {
            // It is a create so any fields missing in updatedCustomFieldValues should be initialised to zero
            overwriteAllFields = true;
            issueType = newIssueType;
        }

        ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = project.getConfig().getParallelTaskGroupsConfig(issueType);

        if (parallelTaskGroupsConfig == null) {
            return Collections.emptyMap();
        }

        final Map<ParallelTaskGroupPosition, Integer> parallelTaskValues = new HashMap<>();

        List<ProjectParallelTaskConfig> groups = parallelTaskGroupsConfig.getConfigGroups();

        for (int groupIndex = 0 ; groupIndex < groups.size() ; groupIndex++) {
            ProjectParallelTaskConfig parallelTaskConfig = groups.get(groupIndex);

            for (ParallelTaskCustomFieldConfig customFieldConfig : parallelTaskConfig.getConfigs().values()) {
                String value = updatedCustomFieldValues.get(customFieldConfig.getId());

                if (value != null) {
                    int taskIndex = parallelTaskConfig.getIndex(customFieldConfig.getName());
                    SortedParallelTaskFieldOptions options = project.getParallelTaskOptions().getOptions(issueType).get(customFieldConfig.getName());
                    int optionIndex = options.getIndex(value);
                    parallelTaskValues.put(new ParallelTaskGroupPosition(groupIndex, taskIndex), optionIndex);
                } else if (overwriteAllFields) {
                    int taskIndex = parallelTaskConfig.getIndex(customFieldConfig.getName());
                    parallelTaskValues.put(new ParallelTaskGroupPosition(groupIndex, taskIndex), 0);
                }
            }
        }
        return parallelTaskValues;
    }


    public String getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }

    void serializeRegistry(ModelNode list) {
        ModelNode entry = new ModelNode();
        entry.get(Constants.KEY).set(key);
        entry.get(Constants.VALUE).set(value);
        list.add(entry);
    }

    public String getCustomFieldName() {
        return customFieldName;
    }

    public String getValueForComparator() {
        return value;
    }

}
