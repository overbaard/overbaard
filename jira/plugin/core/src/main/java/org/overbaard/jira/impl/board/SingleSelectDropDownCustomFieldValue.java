/*
 * JBoss, Home of Professional Open Source.
 * Copyright 2019, Red Hat, Inc., and individual contributors
 * as indicated by the @author tags. See the copyright.txt file in the
 * distribution for a full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */

package org.overbaard.jira.impl.board;

import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.CustomFieldOptions;
import org.overbaard.jira.impl.JiraInjectables;
import org.overbaard.jira.impl.config.CustomFieldConfig;

import com.atlassian.jira.issue.customfields.option.Option;

/**
 * @author Kabir Khan
 */
class SingleSelectDropDownCustomFieldValue extends CustomFieldValue {
    SingleSelectDropDownCustomFieldValue(String customFieldName, String key, String value) {
        super(customFieldName, key, value);
    }

    static SingleSelectDropDownCustomFieldValue load(CustomFieldConfig config, Object customFieldValue) {
        String key = getKeyForValue(customFieldValue);
        return new SingleSelectDropDownCustomFieldValue(config.getName(), key, key);

    }

    public static CustomFieldValue load(CustomFieldConfig customFieldConfig, String key) {
        return new SingleSelectDropDownCustomFieldValue(customFieldConfig.getName(), key, key);
    }

    public static CustomFieldValue load(
            JiraInjectables jiraInjectables, CustomFieldConfig customFieldConfig, CustomFieldOptions options, Long cfValueId) {
        SortedFieldOptions.CustomFields fieldOptions = options.getCustomFieldsOptions().get(customFieldConfig.getName());
        return fieldOptions.getByCFValueId(cfValueId);
    }

    public static String getKeyForValue(Object fieldValue) {
        if (fieldValue instanceof Option) {
            // When running in Jira
            return ((Option) fieldValue).getValue();
        } else if (fieldValue instanceof String) {
            // When running unit tests
            return (String) fieldValue;
        } else {
            // Something went wrong
            OverbaardLogger.LOGGER.warn("Unknown type for single select option: " + fieldValue);
            return fieldValue.toString();
        }
    }


    public static String getChangeValue(Object fieldValue) {
        return fieldValue.toString();
    }

}
