package org.overbaard.jira.impl.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ProjectParallelTaskGroupsConfig {
    private final CustomFieldRegistry<ParallelTaskCustomFieldConfig> configs;
    private final List<ProjectParallelTaskConfig> configGroups;
    private final Map<String, ParallelTaskGroupPosition> groupIndices;

    ProjectParallelTaskGroupsConfig(List<Map<String, ParallelTaskCustomFieldConfig>> configGroups) {
        List<ProjectParallelTaskConfig> groups = new ArrayList<>();
        Map<String, ParallelTaskCustomFieldConfig> flattenedConfigs = new HashMap<>();
        Map<String, ParallelTaskGroupPosition> groupIndices = new HashMap<>();

        for (int groupIndex = 0 ; groupIndex < configGroups.size() ; groupIndex++) {
            Map<String, ParallelTaskCustomFieldConfig> curr = configGroups.get(groupIndex);
            flattenedConfigs.putAll(curr);
            ProjectParallelTaskConfig config = new ProjectParallelTaskConfig(curr);
            groups.add(config);

            Set<String> keySet = config.keySet();
            int taskIndex = 0;
            for (String key : keySet) {
                groupIndices.put(key, new ParallelTaskGroupPosition(groupIndex, taskIndex));
                taskIndex++;
            }
        }
        this.configs = new CustomFieldRegistry<>(flattenedConfigs);
        this.configGroups = Collections.unmodifiableList(groups);
        this.groupIndices = Collections.unmodifiableMap(groupIndices);
    }

    public List<ProjectParallelTaskConfig> getConfigGroups() {
        return configGroups;
    }

    public ParallelTaskGroupPosition getPosition(String key) {
        return groupIndices.get(key);
    }


    public ParallelTaskCustomFieldConfig forPosition(int groupIndex, int taskIndex) {
        return forPosition(new ParallelTaskGroupPosition(groupIndex, taskIndex));
    }

    public ParallelTaskCustomFieldConfig forPosition(ParallelTaskGroupPosition position) {
        ProjectParallelTaskConfig config = configGroups.get(position.getGroupIndex());
        return config.forIndex(position.getTaskIndex());
    }

    public ParallelTaskCustomFieldConfig getCustomFieldObjectForJiraName(String jiraCustomFieldName) {
        return configs.getForJiraName(jiraCustomFieldName);
    }

    public List<ProjectParallelTaskConfig> getGroups() {
        return configGroups;
    }

    public Collection<ParallelTaskCustomFieldConfig> getFieldConfigs() {
        return configs.values();
    }

    public CustomFieldRegistry<ParallelTaskCustomFieldConfig> getConfigs() {
        return configs;
    }
}
