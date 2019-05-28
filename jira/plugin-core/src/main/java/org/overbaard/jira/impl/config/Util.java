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

import java.util.List;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;

/**
 * @author Kabir Khan
 */
class Util {
    static ModelNode getRequiredChild(ModelNode modelNode, String type, String typeName, String childName) {
        ModelNode value = modelNode.get(childName);
        if (!value.isDefined()) {
            throw new IllegalStateException(type + " '" + typeName + "' does not have a '" + childName +"' field");
        }
        return value;
    }

    static String getRequiredString(ModelNode modelNode, String name, String missingError, String typeError) {
        if (!modelNode.hasDefined(name)) {
            throw new OverbaardValidationException(missingError);
        }
        final ModelNode stringNode = modelNode.get(name);
        if (stringNode.getType() != ModelType.STRING) {
            throw new OverbaardValidationException(typeError);
        }
        return stringNode.asString();
    }

    static List<ModelNode> validateMinSizeArray(ModelNode modelNode, int minSize, String typeError, String sizeError) {
        if (modelNode.getType() != ModelType.LIST) {
            throw new OverbaardValidationException(typeError);
        }
        List<ModelNode> listNode = modelNode.asList();
        if (listNode.size() < minSize) {
            throw new OverbaardValidationException(sizeError);
        }
        return listNode;
    }

}
