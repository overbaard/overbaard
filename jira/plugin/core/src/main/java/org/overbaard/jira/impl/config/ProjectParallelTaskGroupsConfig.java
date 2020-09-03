package org.overbaard.jira.impl.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ProjectParallelTaskGroupsConfig {

    // Used when an issue type override wants to use no parallel tasks
    public static ProjectParallelTaskGroupsConfig EMPTY_OVERRIDE = new ProjectParallelTaskGroupsConfig(Collections.emptyList());

    private final CustomFieldRegistry<ParallelTaskCustomFieldConfig> configs;
    private final List<ProjectParallelTaskConfig> configGroups;
    private final Map<String, ParallelTaskGroupPosition> groupIndices;

    private ProjectParallelTaskGroupsConfig(List<Map<String, ParallelTaskCustomFieldConfig>> configGroups) {
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

    static ProjectParallelTaskGroupsConfig loadAndValidate(BoardParallelTaskConfig parallelTaskConfig, ModelNode parallelTaskGroups, String projectCode) {
        return loadAndValidate(parallelTaskConfig, parallelTaskGroups, projectCode, null);
    }

    static ProjectParallelTaskGroupsConfig loadAndValidate(BoardParallelTaskConfig parallelTaskConfig, ModelNode parallelTaskGroups, String projectCode, List<String> issueTypes) {

        if (!parallelTaskGroups.isDefined() && issueTypes != null) {
            // Used when a project has PTs defined, but we want to turn those off for an issue type
            return ProjectParallelTaskGroupsConfig.EMPTY_OVERRIDE;
        } else if (parallelTaskGroups.getType() != ModelType.LIST) {
            throw new OverbaardValidationException(getErrorStringStart(projectCode, issueTypes) + " must be an array");
        }

        List<Map<String, ParallelTaskCustomFieldConfig>> fieldConfigs = new ArrayList<>();

        for (ModelNode parallelTaskGroup : parallelTaskGroups.asList()) {
            if (parallelTaskGroups.getType() != ModelType.LIST) {
                throw new OverbaardValidationException(getErrorStringStart(projectCode, issueTypes) + " must be an array");
            }
            Map<String, ParallelTaskCustomFieldConfig> groupFieldConfigs = new LinkedHashMap<>();
            boolean first = true;
            for (ModelNode parallelTask : parallelTaskGroup.asList()) {
                ParallelTaskCustomFieldConfig fieldConfig = parallelTaskConfig.getConfigs().getForOverbaardName(parallelTask.asString());
                if (fieldConfig == null) {
                    throw new OverbaardValidationException(getErrorStringStart(projectCode, issueTypes) +
                            "references a parallel task '" + parallelTask.asString() + "' which does not exist in the global parallel-tasks fields list");
                }
                groupFieldConfigs.put(fieldConfig.getName(), fieldConfig);
                if (first) {
                    fieldConfigs.add(groupFieldConfigs);
                    first = false;
                }
            }
        }

        return new ProjectParallelTaskGroupsConfig(fieldConfigs);
    }

    private static String getErrorStringStart(String projectCode, List<String> issueTypes) {
        if (issueTypes == null) {
            return "The \"parallel-task-groups\" element of project \"" + projectCode + "\"";
        }
        return "The \"overrides/parallel-task-groups\" element of project \"" + projectCode + "\" for issueTypes " + issueTypes;

    }


    ModelNode serializeForConfig() {
        ModelNode parallelTaskGroupsNode = new ModelNode().setEmptyList();
        for (ProjectParallelTaskConfig ptCfg : getGroups()) {
            ModelNode group = new ModelNode().setEmptyList();
            for (ParallelTaskCustomFieldConfig parallelTaskCustomFieldConfig : ptCfg.getConfigs().values()) {
                group.add(parallelTaskCustomFieldConfig.getName());
            }
            parallelTaskGroupsNode.add(group);
        }
        return parallelTaskGroupsNode;
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

    @Override
    public String toString() {
        return "ProjectParallelTaskGroupsConfig{" +
                "\nconfigs=" + configs +
                ",\nconfigGroups=" + configGroups +
                ",\ngroupIndices=" + groupIndices +
                '}';
    }
}
