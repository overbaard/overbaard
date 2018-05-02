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

package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.DISPLAY;

import java.util.Map;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.impl.util.IndexedMap;

/**
 * @author Kabir Khan
 */
abstract class ParallelTaskConfig {
    protected final CustomFieldRegistry<ParallelTaskCustomFieldConfig> configs;
    protected final IndexedMap<String, ParallelTaskCustomFieldConfig> indexedConfigs;


    protected ParallelTaskConfig(Map<String, ParallelTaskCustomFieldConfig> configs) {
        this.configs = new CustomFieldRegistry<>(configs);
        this.indexedConfigs = new IndexedMap<>(configs);
    }

    public CustomFieldRegistry<ParallelTaskCustomFieldConfig> getConfigs() {
        return configs;
    }

    public Integer getIndex(String key) {
        return indexedConfigs.getIndex(key);
    }

    public ParallelTaskCustomFieldConfig forIndex(int index) {
        return indexedConfigs.forIndex(index);
    }
}
