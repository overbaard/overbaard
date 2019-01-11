package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.ENTRIES;
import static org.overbaard.jira.impl.Constants.ISSUE_QL;
import static org.overbaard.jira.impl.Constants.NAME;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ManualSwimlanesConfig {
    private final List<ManualSwimlane> manualSwimlanes;

    private ManualSwimlanesConfig(List<ManualSwimlane> manualSwimlanes) {
        this.manualSwimlanes = manualSwimlanes;
    }

    static ManualSwimlanesConfig loadAndValidate(ModelNode modelNode, CustomFieldRegistry customFieldRegistry) {
        if (!modelNode.isDefined()) {
            return null;
        }
        final List<ModelNode> swimlaneNodes = Util.validateMinSizeArray(modelNode, 1,
                "'manual-swimlanes' must be of type array",
                "'manual-swimlanes' must have at least one manual swimlane configured");

        final Set<String> swimlaneNames = new HashSet<>();
        final List<ManualSwimlane> swimlanes = new ArrayList<>();
        for (ModelNode swimlaneNode : swimlaneNodes) {
            swimlanes.add(ManualSwimlane.loadAndValidate(swimlaneNode, swimlaneNames, customFieldRegistry));
        }

        return new ManualSwimlanesConfig(Collections.unmodifiableList(swimlanes));
    }

    ModelNode serialize() {
        ModelNode swimlanes = new ModelNode();
        swimlanes.setEmptyList();
        for (ManualSwimlane swimlane : manualSwimlanes) {
            swimlanes.add(swimlane.serialize());
        }

        return swimlanes;
    }


    private static class ManualSwimlane {
        private final String name;
        private final List<ManualSwimlaneEntry> entries;

        private ManualSwimlane(String name, List<ManualSwimlaneEntry> entries) {
            this.name = name;
            this.entries = entries;
        }

        static ManualSwimlane loadAndValidate(ModelNode modelNode, Set<String> swimlaneNames, CustomFieldRegistry customFieldRegistry) {
            final String name = Util.getRequiredString(modelNode, NAME,
                    "Missing 'name' in 'manual-swimlanes' entry",
                    "Names of 'manual-swimlanes' values must be strings");

            final List<ModelNode> entriesNodes = Util.validateMinSizeArray(modelNode.get(ENTRIES), 1,
                    "manual-swimlanes[" + name + "] must be of type array",
                    "manual-swimlanes[" + name + "] must have at least one entry");

            if (!swimlaneNames.add(name)) {
                throw new OverbaardValidationException("The name '" + name + "' is used for more than one manual swimlane. " +
                        "The names need to be unique");
            }

            if (customFieldRegistry.getForOverbaardName(name) != null) {
                throw new OverbaardValidationException("The name '" + name + "' used for a manual swimlane is " +
                        "already used for a custom field. This is not allowed.");
            }

            final List<ManualSwimlaneEntry> entries = new ArrayList<>();
            for (ModelNode entryNode : entriesNodes) {
                entries.add(ManualSwimlaneEntry.loadAndValidate(entryNode, name));
            }

            return new ManualSwimlane(name, Collections.unmodifiableList(entries));
        }

        ModelNode serialize() {
            ModelNode entries = new ModelNode();
            entries.setEmptyList();
            for (ManualSwimlaneEntry entry : this.entries) {
                entries.add(entry.serialize());
            }

            ModelNode result = new ModelNode();
            result.get(NAME).set(name);
            result.get(ENTRIES).set(entries);
            return result;
        }
    }

    private static class ManualSwimlaneEntry {
        private final String name;
        private final String issueQl;

        ManualSwimlaneEntry(String name, String issueQl) {
            this.name = name;
            this.issueQl = issueQl;
        }

        static final ManualSwimlaneEntry loadAndValidate(ModelNode modelNode, String swimlaneName) {
            final String name = Util.getRequiredString(modelNode, NAME,
                    "Missing 'name' in manual-swimlanes[" + swimlaneName + "].entries entry",
                    "'name' in manual-swimlanes[\" + swimlaneName + \"].entries entries must be a string");

            final String issueQl = Util.getRequiredString(modelNode, Constants.ISSUE_QL,
                    "Missing 'issue-ql' in manual-swimlanes[" + swimlaneName + "][" + name + "]",
                    "'issue-ql' in manual-swimlanes[" + swimlaneName + "][" + name + "] must be a string");

            return new ManualSwimlaneEntry(name, issueQl);
        }

        ModelNode serialize() {
            ModelNode result = new ModelNode();
            result.get(NAME).set(name);
            result.get(ISSUE_QL).set(issueQl);
            return result;
        }
    }
}
