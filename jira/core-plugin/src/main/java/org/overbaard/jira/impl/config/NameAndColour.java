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

import static org.overbaard.jira.impl.Constants.NAME;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.impl.Constants;

/**
 * @author Kabir Khan
 */
public class NameAndColour {
    private final String name;
    private final String colour;

    public NameAndColour(String name, String colour) {
        this.name = name;
        this.colour = colour;
    }

    public void serialize(ModelNode parent) {
        ModelNode modelNode = new ModelNode();
        modelNode.get(NAME).set(name);
        modelNode.get(Constants.COLOUR).set(colour);
        parent.add(modelNode);
    }

    public String getName() {
        return name;
    }
}
