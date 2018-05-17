package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.DISPLAY;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.JiraInjectables;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardParallelTaskConfig extends ParallelTaskConfig {
    public BoardParallelTaskConfig(Map<String, ParallelTaskCustomFieldConfig> configs) {
        super(configs);
    }

    public static BoardParallelTaskConfig load(JiraInjectables jiraInjectables, CustomFieldRegistry<CustomFieldConfig> customFields, ModelNode parallelTask) {
        if (parallelTask.getType() != ModelType.LIST) {
            throw new OverbaardValidationException("The parallel-tasks fields element must be an array");
        }

        Map<String, ParallelTaskCustomFieldConfig> configs = new LinkedHashMap<>();
        final List<ModelNode> customConfigs = parallelTask.asList();
        final Set<String> seenTaskCodes = new HashSet<>();
        final Set<String> seenTaskNames = new HashSet<>();
        for (ModelNode customConfig : customConfigs) {
            final ParallelTaskCustomFieldConfig customFieldConfig =
                    CustomFieldConfigImpl.loadParallelTaskCustomFieldConfig(jiraInjectables, customConfig);
            final CustomFieldConfig exisiting = customFields.getForJiraId(customFieldConfig.getId());
            if (exisiting != null) {
                throw new OverbaardValidationException("The custom field with id " +
                        customFieldConfig.getId() + "used in parallel-tasks is already " +
                        "used in custom field " + exisiting.getName() + "' which is not allowed.");
            }
            configs.put(customFieldConfig.getName(), customFieldConfig);
            if (!seenTaskCodes.add(customFieldConfig.getCode())) {
                throw new OverbaardValidationException("Codes must be unique within the parallel-tasks fields. '"
                        + customFieldConfig.getCode() + "' was used more than once.");
            }
            if (!seenTaskNames.add(customFieldConfig.getName())) {
                throw new OverbaardValidationException("Names must be unique within the parallel-tasks fields. '"
                        + customFieldConfig.getName() + "' was used more than once.");
            }
        }

        return new BoardParallelTaskConfig(configs);
    }

    public ModelNode serializeForConfig() {
        ModelNode list = new ModelNode().setEmptyList();
        for (ParallelTaskCustomFieldConfig config : configs.values()) {
            ModelNode entry = config.serializeForConfig();
            entry.get(DISPLAY).set(config.getCode());
            list.add(entry);
        }
        return list;
    }
}
