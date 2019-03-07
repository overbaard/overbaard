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

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Named;

import org.overbaard.jira.api.CustomFieldOptions;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.api.ProjectCustomFieldOptionsLoader;
import org.overbaard.jira.impl.JiraInjectables;
import org.overbaard.jira.impl.config.BoardConfig;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

import com.atlassian.jira.issue.customfields.option.Option;
import com.atlassian.jira.issue.customfields.option.Options;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.jira.issue.fields.config.FieldConfig;
import com.atlassian.jira.issue.issuetype.IssueType;
import com.atlassian.jira.issue.search.SearchContext;
import com.atlassian.jira.project.Project;

/**
 * Used to load up the options for parallel tasks and for
 * custom fields that have a type where the set of options are known in advance.
 *
 * @author Kabir Khan
 */
@Named("overbaardCustomFieldOptionsLoader")
public class ProjectCustomFieldOptionsLoaderImpl implements ProjectCustomFieldOptionsLoader {

    public ParallelTaskOptions loadParallelTaskOptions(JiraInjectables jiraInjectables, BoardConfig boardConfig, BoardProjectConfig projectConfig) {
        ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = projectConfig.getInternalAdvanced().getParallelTaskGroupsConfig();
        Map<String, SortedFieldOptions.ParallelTasks> projectParallelTaskOptions =
                createOptions(jiraInjectables, parallelTaskGroupsConfig, projectConfig.getCode(), null);

        Map<String, Map<String, SortedFieldOptions.ParallelTasks>> issueTypeParallelTaskValues = new LinkedHashMap<>();
        Map<String, ProjectParallelTaskGroupsConfig> overrides = projectConfig.getInternalAdvanced().getIssueTypeParallelTaskGroupsOverrides();

        if (overrides.size() > 0) {
            // Needed since IssueTypeManager.getIssueType() uses the id rather than the name
            final Collection<IssueType> allTypes = jiraInjectables.getIssueTypeManager().getIssueTypes();
            Map<String, IssueType> issueTypeMap = new HashMap<>();
            for (IssueType type : allTypes) {
                issueTypeMap.put(type.getName(), type);
            }


            for (Map.Entry<String, ProjectParallelTaskGroupsConfig> overrideEntry : overrides.entrySet()) {
                for (ParallelTaskCustomFieldConfig config : overrideEntry.getValue().getConfigs().values()) {
                    Map<String, SortedFieldOptions.ParallelTasks> overrideOptions =
                            createOptions(jiraInjectables, overrideEntry.getValue(), projectConfig.getCode(), issueTypeMap.get(overrideEntry.getKey()));
                    issueTypeParallelTaskValues.put(overrideEntry.getKey(), overrideOptions);
                }
            }
        }
        return ParallelTaskOptions.create(projectParallelTaskOptions, issueTypeParallelTaskValues);
    }

    private Map<String, SortedFieldOptions.ParallelTasks> createOptions(
            JiraInjectables jiraInjectables, ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig, String projectCode, IssueType issueType) {

        Map<String, SortedFieldOptions.ParallelTasks> parallelTaskOptions = new LinkedHashMap<>();
        if (parallelTaskGroupsConfig != null) {
            for (ParallelTaskCustomFieldConfig config : parallelTaskGroupsConfig.getConfigs().values()) {
                CustomField customField = config.getJiraCustomField();
                Project jiraProject = jiraInjectables.getProjectManager().getProjectByCurrentKey(projectCode);

                final List<String> issueTypeIds;
                if (issueType == null) {
                    issueTypeIds = Collections.emptyList();
                } else {
                    issueTypeIds = Collections.singletonList(issueType.getId());
                }

                SearchContext searchContext =
                        jiraInjectables.getSearchContextFactory().create(
                                null, Collections.singletonList(jiraProject.getId()), issueTypeIds);
                FieldConfig fieldConfig = customField.getReleventConfig(searchContext);
                Options options = jiraInjectables.getOptionsManager().getOptions(fieldConfig);

                SortedFieldOptions.ParallelTasks.Builder builder = new SortedFieldOptions.ParallelTasks.Builder(config);
                for (Option option : options) {
                    CustomFieldValue value = new ParallelTaskProgressOption(config.getName(), option.getOptionId().toString(), option.getValue());
                    builder.addOption(value);
                }
                parallelTaskOptions.put(config.getName(), builder.build());
            }
        }
        return parallelTaskOptions;
    }

    public CustomFieldOptions loadCustomFieldOptions(JiraInjectables jiraInjectables, BoardConfig boardConfig, BoardProjectConfig projectConfig) {

        Map<String, SortedFieldOptions.CustomFields> customFieldOptions = new LinkedHashMap<>();

        for (String fieldName : projectConfig.getCustomFieldNames()) {
            CustomFieldConfig customFieldConfig = boardConfig.getCustomFieldConfigForOverbaardName(fieldName);

            if (customFieldConfig.getType() == CustomFieldConfig.Type.SINGLE_SELECT_DROPDOWN) {

                final CustomField customField = customFieldConfig.getJiraCustomField();
                final Project jiraProject = jiraInjectables.getProjectManager().getProjectByCurrentKey(projectConfig.getCode());

                // For now assume that the options in for these do not have issue type overrides (how to configure that would require some more thought)
                final List<String> issueTypeIds = Collections.emptyList();

                SearchContext searchContext =
                        jiraInjectables.getSearchContextFactory().create(
                                null, Collections.singletonList(jiraProject.getId()), issueTypeIds);

                FieldConfig fieldConfig = customField.getReleventConfig(searchContext);
                Options options = jiraInjectables.getOptionsManager().getOptions(fieldConfig);

                SortedFieldOptions.CustomFields.Builder builder = new SortedFieldOptions.CustomFields.Builder(customFieldConfig);
                for (Option option : options) {
                    //CustomFieldValue value = new SingleSelectDropDownCustomFieldValue(customFieldConfig.getName(), option.getOptionId().toString(), option.getValue());
                    CustomFieldValue value = new SingleSelectDropDownCustomFieldValue(customFieldConfig.getName(), option.getValue(), option.getValue());
                    builder.addOption(option.getOptionId(), value);
                }
                customFieldOptions.put(customFieldConfig.getName(), builder.build());
            }
        }
        return CustomFieldOptions.create(customFieldOptions);
    }

}
