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
import java.util.LinkedHashMap;
import java.util.Map;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.util.IndexedMap;

/**
 * The sorted parallel field options for a project
 *
 * @author Kabir Khan
 */
public class SortedFieldOptions {
    private static class AbstractFields{
        protected final IndexedMap<String, CustomFieldValue> sortedFields;

        public AbstractFields(IndexedMap<String, CustomFieldValue> sortedFields) {
            this.sortedFields = sortedFields;
        }

        CustomFieldValue get(String key) {
            return sortedFields.get(key);
        }

        Integer getIndex(String key) {
            return sortedFields.getIndex(key);
        }

        public CustomFieldValue forIndex(int index) {
            return sortedFields.forIndex(index);
        }
    }

    public static class ParallelTasks extends AbstractFields {
        private final ParallelTaskCustomFieldConfig config;

        private ParallelTasks(ParallelTaskCustomFieldConfig config, IndexedMap<String, CustomFieldValue> sortedFields) {
            super(sortedFields);
            this.config = config;
        }

        public void serialize(ModelNode list) {
            ModelNode entry = new ModelNode();
            entry.get(Constants.NAME).set(config.getName());
            entry.get(Constants.DISPLAY).set(config.getCode());
            ModelNode options = new ModelNode().setEmptyList();
            sortedFields.values().forEach(customFieldValue -> options.add(customFieldValue.getValue()));
            entry.get(Constants.OPTIONS).set(options);
            list.add(entry);
        }

        static class Builder {
            private final ParallelTaskCustomFieldConfig config;
            private Map<String, CustomFieldValue> options = new LinkedHashMap<>();
            Builder(ParallelTaskCustomFieldConfig config) {
                this.config = config;
            }

            public Builder addOption(CustomFieldValue value) {
                this.options.put(value.getKey(), value);
                return this;
            }

            ParallelTasks build() {
                return new ParallelTasks(config, new IndexedMap<>(options));
            }
        }
    }

    public static class CustomFields extends AbstractFields {
        private final CustomFieldConfig config;
        private final Map<Long, CustomFieldValue> optionsByCfValueId;

        private CustomFields(CustomFieldConfig config, IndexedMap<String, CustomFieldValue> sortedFields,
                             Map<Long, CustomFieldValue> optionsByCustomFieldId) {
            super(sortedFields);
            this.config = config;
            this.optionsByCfValueId = optionsByCustomFieldId;
        }

        CustomFieldValue getByCFValueId(Long customFieldId) {
            return optionsByCfValueId.get(customFieldId);
        }

        CustomFieldConfig getConfig() {
            return config;
        }

        static class Builder {
            private final CustomFieldConfig config;
            private Map<String, CustomFieldValue> options = new LinkedHashMap<>();
            private Map<Long, CustomFieldValue> optionsByCFValueId = new HashMap<Long, CustomFieldValue>();
            Builder(CustomFieldConfig config) {
                this.config = config;
            }

            public CustomFields.Builder addOption(Long valueId, CustomFieldValue value) {
                this.options.put(value.getKey(), value);
                this.optionsByCFValueId.put(valueId, value);
                return this;
            }

            CustomFields build() {
                return new CustomFields(
                        config,
                        new IndexedMap<>(options),
                        Collections.unmodifiableMap(optionsByCFValueId));
            }
        }
    }

}
