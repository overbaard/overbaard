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

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Assert;
import org.overbaard.jira.api.CustomFieldOptions;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.api.ProjectCustomFieldOptionsLoader;
import org.overbaard.jira.impl.JiraInjectables;
import org.overbaard.jira.impl.config.BoardConfig;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

/**
 * @author Kabir Khan
 */
public class ProjectParallelTaskOptionsLoaderBuilder {
    Map<String, Map<Long, Map<String, String>>> parallelTaskOptionsByProject = new LinkedHashMap<>();
    Map<String, Map<String, Map<Long, Map<String, String>>>> parallelTaskOptionsByIssueTypeAndProject = new LinkedHashMap<>();

    Map<String, Map<Long, Map<String, String>>> customFieldOptionsByProject = new LinkedHashMap<>();

    public ProjectParallelTaskOptionsLoaderBuilder addParallelTaskOption(String projectName, Long customFieldId, String optionKey, String optionName) {
        Map<Long, Map<String, String>> optionsByCustomField = parallelTaskOptionsByProject.computeIfAbsent(projectName, k -> new LinkedHashMap<>());
        Map<String, String> options = optionsByCustomField.computeIfAbsent(customFieldId, k -> new LinkedHashMap<String, String>());
        options.put(optionKey, optionName);
        return this;
    }

    public ProjectParallelTaskOptionsLoaderBuilder addParallelTaskOption(String projectName, String issueType, Long customFieldId, String optionKey, String optionName) {
        Map<String, Map<Long, Map<String, String>>> optionsByIssueType = parallelTaskOptionsByIssueTypeAndProject.computeIfAbsent(projectName, k -> new LinkedHashMap<>());
        Map<Long, Map<String, String>> optionsByCustomField = optionsByIssueType.computeIfAbsent(issueType, k -> new LinkedHashMap<>());
        Map<String, String> options = optionsByCustomField.computeIfAbsent(customFieldId, k -> new LinkedHashMap<String, String>());
        options.put(optionKey, optionName);
        return this;
    }

    public ProjectParallelTaskOptionsLoaderBuilder addCustomFieldOption(String projectName, Long customFieldId, String optionKey, String optionName) {
        Map<Long, Map<String, String>> optionsByCustomField = customFieldOptionsByProject.computeIfAbsent(projectName, k -> new LinkedHashMap<>());
        Map<String, String> options = optionsByCustomField.computeIfAbsent(customFieldId, k -> new LinkedHashMap<String, String>());
        options.put(optionKey, optionName);
        return this;
    }


    public ProjectCustomFieldOptionsLoader build() {
        return new ProjectCustomFieldOptionsLoader() {
            @Override
            public ParallelTaskOptions loadParallelTaskOptions(JiraInjectables jiraInjectables, BoardConfig boardConfig, BoardProjectConfig projectConfig) {
                Map<String, SortedFieldOptions.ParallelTasks> parallelTaskOptions = new LinkedHashMap<>();

                ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = projectConfig.getInternalAdvanced().getParallelTaskGroupsConfig();

                if (parallelTaskGroupsConfig != null) {
                    Map<Long, Map<String, String>> optionsByCustomField = parallelTaskOptionsByProject.get(projectConfig.getCode());
                    Assert.assertNotNull(optionsByCustomField);

                    addOptions(parallelTaskGroupsConfig, optionsByCustomField, parallelTaskOptions);
                }

                Map<String, Map<String, SortedFieldOptions.ParallelTasks>> issueTypeParallelTaskOptions = new LinkedHashMap<>();
                Map<String, ProjectParallelTaskGroupsConfig> overrides = projectConfig.getInternalAdvanced().getIssueTypeParallelTaskGroupsOverrides();
                for (Map.Entry<String, ProjectParallelTaskGroupsConfig> overrideEntry : overrides.entrySet()) {
                    Map<String, Map<Long, Map<String, String>>> optionsByIssueType = parallelTaskOptionsByIssueTypeAndProject.get(projectConfig.getCode());
                    Assert.assertNotNull(optionsByIssueType);
                    Map<Long, Map<String, String>> optionsByCustomField = optionsByIssueType.get(overrideEntry.getKey());
                    Assert.assertNotNull(optionsByCustomField);

                    Map<String, SortedFieldOptions.ParallelTasks> overrideOptions = new LinkedHashMap<>();
                    addOptions(overrideEntry.getValue(), optionsByCustomField, overrideOptions);
                    issueTypeParallelTaskOptions.put(overrideEntry.getKey(), overrideOptions);

                }
                return ParallelTaskOptions.create(parallelTaskOptions, issueTypeParallelTaskOptions);
            }

            @Override
            public CustomFieldOptions loadCustomFieldOptions(JiraInjectables jiraInjectables, BoardConfig boardConfig, BoardProjectConfig projectConfig) {
                Map<String, SortedFieldOptions.CustomFields> customFieldOptions = new LinkedHashMap<>();

                for (String fieldName : projectConfig.getCustomFieldNames()) {
                    CustomFieldConfig config = boardConfig.getCustomFieldConfigForOverbaardName(fieldName);
                    Assert.assertNotNull(config);
                    Map<Long, Map<String, String>> optionsByCustomField = customFieldOptionsByProject.get(projectConfig.getCode());
                    if (config.getType() == CustomFieldConfig.Type.SINGLE_SELECT_DROPDOWN) {
                        Assert.assertNotNull(optionsByCustomField);
                        Map<String, String> options = optionsByCustomField.get(config.getId());
                        Assert.assertNotNull(options);

                        SortedFieldOptions.CustomFields.Builder builder = new SortedFieldOptions.CustomFields.Builder(config);
                        long l = 10000;
                        for (Map.Entry<String, String> option : options.entrySet()) {
                            CustomFieldValue value = new SingleSelectDropDownCustomFieldValue(config.getName(), option.getKey(), option.getValue());
                            Long cfValueId = ++l; // This should not matter for this call path
                            builder.addOption(cfValueId, value);
                        }
                        customFieldOptions.put(config.getName(), builder.build());
                    }
                }
                return CustomFieldOptions.create(customFieldOptions);
            }
        };
    }

    private void addOptions(
            ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig,
            Map<Long, Map<String, String>> optionsByCustomField,
            Map<String, SortedFieldOptions.ParallelTasks> parallelTaskOptions) {

        for (ParallelTaskCustomFieldConfig config : parallelTaskGroupsConfig.getConfigs().values()) {
            Map<String, String> options = optionsByCustomField.get(config.getId());
            Assert.assertNotNull(options);

            SortedFieldOptions.ParallelTasks.Builder builder = new SortedFieldOptions.ParallelTasks.Builder(config);
            for (Map.Entry<String, String> option : options.entrySet()) {
                CustomFieldValue value = new ParallelTaskProgressOption(config.getName(), option.getKey(), option.getValue());
                builder.addOption(value);
            }
            parallelTaskOptions.put(config.getName(), builder.build());
        }
    }
}
