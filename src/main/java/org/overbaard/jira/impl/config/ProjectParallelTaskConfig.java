package org.overbaard.jira.impl.config;

import java.util.Map;
import java.util.Set;

import org.overbaard.jira.impl.util.IndexedMap;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ProjectParallelTaskConfig extends ParallelTaskConfig {
    protected final CustomFieldRegistry<ParallelTaskCustomFieldConfig> configs;
    protected final IndexedMap<String, ParallelTaskCustomFieldConfig> indexedConfigs;

    ProjectParallelTaskConfig(Map<String, ParallelTaskCustomFieldConfig> configs) {
        super(configs);
        this.configs = new CustomFieldRegistry<>(configs);
        this.indexedConfigs = new IndexedMap<>(configs);

    }

    Set<String> keySet() {
        return indexedConfigs.map().keySet();
    }
}
