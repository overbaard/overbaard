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

import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.api.ProjectParallelTaskOptionsLoader;
import org.overbaard.jira.impl.JiraInjectables;
import org.overbaard.jira.impl.config.BoardConfig;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.junit.Assert;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

/**
 * @author Kabir Khan
 */
public class ProjectParallelTaskOptionsLoaderBuilder {
    Map<String, Map<Long, Map<String, String>>> customFieldOptionsByProject = new LinkedHashMap<>();
    Map<String, Map<String, Map<Long, Map<String, String>>>> customFieldOptionsByIssueTypeAndProject = new LinkedHashMap<>();

    public ProjectParallelTaskOptionsLoaderBuilder addCustomFieldOption(String projectName, Long customFieldId, String optionKey, String optionName) {
        Map<Long, Map<String, String>> optionsByCustomField = customFieldOptionsByProject.computeIfAbsent(projectName, k -> new LinkedHashMap<>());
        Map<String, String> options = optionsByCustomField.computeIfAbsent(customFieldId, k -> new LinkedHashMap<String, String>());
        options.put(optionKey, optionName);
        return this;
    }

    public ProjectParallelTaskOptionsLoaderBuilder addCustomFieldOption(String projectName, String issueType, Long customFieldId, String optionKey, String optionName) {
        Map<String, Map<Long, Map<String, String>>> optionsByIssueType = customFieldOptionsByIssueTypeAndProject.computeIfAbsent(projectName, k -> new LinkedHashMap<>());
        Map<Long, Map<String, String>> optionsByCustomField = optionsByIssueType.computeIfAbsent(issueType, k -> new LinkedHashMap<>());
        Map<String, String> options = optionsByCustomField.computeIfAbsent(customFieldId, k -> new LinkedHashMap<String, String>());
        options.put(optionKey, optionName);
        return this;
    }

    public ProjectParallelTaskOptionsLoader build() {
        return new ProjectParallelTaskOptionsLoader() {
            @Override
            public ParallelTaskOptions loadValues(JiraInjectables jiraInjectables, BoardConfig boardConfig, BoardProjectConfig projectConfig) {
                Map<String, SortedParallelTaskFieldOptions> parallelTaskOptions = new LinkedHashMap<>();

                ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = projectConfig.getInternalAdvanced().getParallelTaskGroupsConfig();

                if (parallelTaskGroupsConfig != null) {
                    Map<Long, Map<String, String>> optionsByCustomField = customFieldOptionsByProject.get(projectConfig.getCode());
                    Assert.assertNotNull(optionsByCustomField);

                    addOptions(parallelTaskGroupsConfig, optionsByCustomField, parallelTaskOptions);
                }

                Map<String, Map<String, SortedParallelTaskFieldOptions>> issueTypeParallelTaskOptions = new LinkedHashMap<>();
                Map<String, ProjectParallelTaskGroupsConfig> overrides = projectConfig.getInternalAdvanced().getIssueTypeParallelTaskGroupsOverrides();
                for (Map.Entry<String, ProjectParallelTaskGroupsConfig> overrideEntry : overrides.entrySet()) {
                    Map<String, Map<Long, Map<String, String>>> optionsByIssueType = customFieldOptionsByIssueTypeAndProject.get(projectConfig.getCode());
                    Assert.assertNotNull(optionsByIssueType);
                    Map<Long, Map<String, String>> optionsByCustomField = optionsByIssueType.get(overrideEntry.getKey());
                    Assert.assertNotNull(optionsByCustomField);

                    Map<String, SortedParallelTaskFieldOptions> overrideOptions = new LinkedHashMap<>();
                    addOptions(overrideEntry.getValue(), optionsByCustomField, overrideOptions);
                    issueTypeParallelTaskOptions.put(overrideEntry.getKey(), overrideOptions);

                }
                return ParallelTaskOptions.create(parallelTaskOptions, issueTypeParallelTaskOptions);
            }
        };
    }

    private void addOptions(
            ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig,
            Map<Long, Map<String, String>> optionsByCustomField,
            Map<String, SortedParallelTaskFieldOptions> parallelTaskOptions) {

        for (ParallelTaskCustomFieldConfig config : parallelTaskGroupsConfig.getConfigs().values()) {
            Map<String, String> options = optionsByCustomField.get(config.getId());
            Assert.assertNotNull(options);

            SortedParallelTaskFieldOptions.Builder builder = new SortedParallelTaskFieldOptions.Builder(config);
            for (Map.Entry<String, String> option : options.entrySet()) {
                CustomFieldValue value = new ParallelTaskProgressOption(config.getName(), option.getKey(), option.getValue());
                builder.addOption(value);
            }
            parallelTaskOptions.put(config.getName(), builder.build());
        }
    }
}
