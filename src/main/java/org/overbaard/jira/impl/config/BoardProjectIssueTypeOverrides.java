package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.OVERRIDE;
import static org.overbaard.jira.impl.Constants.OVERRIDES;
import static org.overbaard.jira.impl.Constants.STATE_LINKS;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardProjectIssueTypeOverrides {
    private final List<StateLinksConfigOverride> stateLinksConfigOverrides;

    private BoardProjectIssueTypeOverrides(List<StateLinksConfigOverride> configOverrides) {
        this.stateLinksConfigOverrides = Collections.unmodifiableList(configOverrides);
    }

    ModelNode serializeModelNodeForConfig() {
        ModelNode modelNode = new ModelNode();
        if (stateLinksConfigOverrides.size() > 0) {
            for (StateLinksConfigOverride override : stateLinksConfigOverrides) {
                modelNode.get(STATE_LINKS).add(override.serializeModelNodeForConfig());
            }
        }
        return modelNode;
    }


    public ModelNode serializeModelNodeForBoard() {
        ModelNode modelNode = new ModelNode();
        if (stateLinksConfigOverrides.size() > 0) {
            for (StateLinksConfigOverride override : stateLinksConfigOverrides) {
                modelNode.get(STATE_LINKS).add(override.serializeModelNodeForBoard());
            }
        }
        return modelNode;
    }

    static BoardProjectIssueTypeOverrides load(ModelNode overridesNode, BoardStates boardStates, String projectCode, Set<String> existingIssueTypes) {
        List<StateLinksConfigOverride> stateLinksConfigOverrides = new ArrayList<>();
        if (overridesNode.isDefined()) {
            loadStateLinksOverrides(stateLinksConfigOverrides, overridesNode, boardStates, projectCode, existingIssueTypes);
        }

        return new BoardProjectIssueTypeOverrides(stateLinksConfigOverrides);
    }

    static void loadStateLinksOverrides(
            List<StateLinksConfigOverride> overrides, ModelNode overridesNode,
            BoardStates boardStates, String projectCode, Set<String> existingIssueTypes) {

        ModelNode stateLinksNode = overridesNode.get(STATE_LINKS);
        if (!stateLinksNode.isDefined()) {
            return;
        }
        if (stateLinksNode.getType() != ModelType.LIST) {
            throw new OverbaardValidationException("'overrides/state-links' for " + projectCode + " should be an array");
        }

        Set<String> issueTypes = new HashSet<>();
        for (ModelNode override : stateLinksNode.asList()) {
            StateLinksConfigOverride linksOverride = StateLinksConfigOverride.load(override, boardStates, projectCode, existingIssueTypes);
            for (String issueType : linksOverride.getIssueTypes()) {
                if (!issueTypes.add(issueType)) {
                    throw new OverbaardValidationException("Issue type '" + issueType + "' appears more than once in 'overrides/state-links' for " + projectCode);
                }
            }
            overrides.add(linksOverride);
        }
    }



    private static abstract class IssueTypeConfigOverride {
        private final List<String> issueTypes;

        public IssueTypeConfigOverride(List<String> issueTypes) {
            this.issueTypes = issueTypes;
        }

        public List<String> getIssueTypes() {
            return issueTypes;
        }

        ModelNode serializeModelNodeForConfig() {
            return createEmptyNodeWithIssueTypesList();
        }

        ModelNode serializeModelNodeForBoard() {
            return createEmptyNodeWithIssueTypesList();
        }

        private ModelNode createEmptyNodeWithIssueTypesList() {
            ModelNode list = new ModelNode();
            for (String type : issueTypes) {
                list.add(type);
            }

            ModelNode node = new ModelNode();
            node.get(ISSUE_TYPES).set(list);
            return node;
        }

        static List<String> loadAndValidateIssueTypes(ModelNode issueTypesNode, String projectCode, String overridesChild, Set<String> existingIssueTypes) {
            if (issueTypesNode.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("'overrides/" + overridesChild + "' for " + projectCode + " should be an array");
            }

            List<String> types = new ArrayList<>();
            for (ModelNode type : issueTypesNode.asList()) {
                String issueType = type.asString();
                if (!existingIssueTypes.contains(issueType)) {
                    throw new OverbaardValidationException("Issue type '" + issueType +
                            "' in 'overrides/" + overridesChild + "' for " + projectCode + " has not been defined in the board's issue-types section");
                }
                types.add(issueType);
            }
            if (types.size() == 0) {
                throw new OverbaardValidationException("No issue types defined in " +
                        " the 'overrides/" + overridesChild + "' for " + projectCode + " has not been defined in the board's issue-types section");
            }
            return types;
        }

    }


    private static class StateLinksConfigOverride extends IssueTypeConfigOverride {

        private final BoardProjectStateMapper stateMapper;


        StateLinksConfigOverride(List<String> issueTypes, BoardProjectStateMapper stateMapper) {
            super(issueTypes);
            this.stateMapper = stateMapper;
        }

        ModelNode serializeModelNodeForConfig() {
            ModelNode override = super.serializeModelNodeForConfig();
            override.get(OVERRIDE).set(stateMapper.serializeModelNodeForConfig());
            return override;
        }

        ModelNode serializeModelNodeForBoard() {
            ModelNode override = super.serializeModelNodeForBoard();
            override.get(OVERRIDE).set(stateMapper.serializeModelNodeForBoard());
            return override;
        }

        static StateLinksConfigOverride load(ModelNode overrideNode, BoardStates boardStates, String projectCode, Set<String> existingIssueTypes) {

            ModelNode issueTypesNode = overrideNode.get(Constants.ISSUE_TYPES);
            List<String> issueTypes = loadAndValidateIssueTypes(issueTypesNode, projectCode, STATE_LINKS, existingIssueTypes);
            BoardProjectStateMapper stateMapper = BoardProjectStateMapper.load(overrideNode.get(OVERRIDE), boardStates);
            return new StateLinksConfigOverride(issueTypes, stateMapper);
        }
    }

}
