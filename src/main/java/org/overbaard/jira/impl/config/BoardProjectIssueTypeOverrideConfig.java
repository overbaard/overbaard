package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.OVERRIDE;
import static org.overbaard.jira.impl.Constants.PARALLEL_TASKS;
import static org.overbaard.jira.impl.Constants.STATE_LINKS;
import static org.overbaard.jira.impl.Constants.TYPE;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;
import java.util.function.Consumer;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.board.SortedParallelTaskFieldOptions;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardProjectIssueTypeOverrideConfig {
    private final List<StateLinksConfigOverride> stateLinksConfigOverrides;
    private final List<ParallelTasksConfigOverride> parallelTasksConfigOverrides;

    private final Map<String, BoardProjectStateMapper> stateLinkOverrides;
    private final Map<String, ProjectParallelTaskGroupsConfig> parallelTaskOverrides;

    private BoardProjectIssueTypeOverrideConfig(List<StateLinksConfigOverride> configOverrides, List<ParallelTasksConfigOverride> parallelTasksConfigOverrides) {
        this.stateLinksConfigOverrides = Collections.unmodifiableList(configOverrides);
        this.parallelTasksConfigOverrides = parallelTasksConfigOverrides;

        Map<String, BoardProjectStateMapper> stateLinkOverrides = new HashMap<>();
        for (StateLinksConfigOverride override : stateLinksConfigOverrides) {
            for (String issueType : override.getIssueTypes()) {
                stateLinkOverrides.put(issueType, override.stateMapper);
            }
        }
        this.stateLinkOverrides = Collections.unmodifiableMap(stateLinkOverrides);

        Map<String, ProjectParallelTaskGroupsConfig> parallelTaskOverrides = new HashMap<>();
        for (ParallelTasksConfigOverride override : parallelTasksConfigOverrides) {
            for (String issueType : override.getIssueTypes()) {
                parallelTaskOverrides.put(issueType, override.parallelTasks);
            }
        }
        this.parallelTaskOverrides = Collections.unmodifiableMap(parallelTaskOverrides);
    }

    BoardProjectStateMapper getStateLinksOverride(String issueType) {
        return stateLinkOverrides.get(issueType);
    }

    ProjectParallelTaskGroupsConfig getParallelTaskGroupsConfig(String issueType) {
        return parallelTaskOverrides.get(issueType);
    }

    ModelNode serializeModelNodeForConfig() {
        ModelNode modelNode = new ModelNode();
        if (stateLinksConfigOverrides.size() > 0) {
            for (StateLinksConfigOverride override : stateLinksConfigOverrides) {
                modelNode.get(STATE_LINKS).add(override.serializeModelNodeForConfig());
            }
        }
        if (parallelTasksConfigOverrides.size() > 0) {
            for (ParallelTasksConfigOverride override : parallelTasksConfigOverrides) {
                modelNode.get(PARALLEL_TASKS).add(override.serializeModelNodeForConfig());
            }
        }
        return modelNode;
    }

    public void iterateStateLinkOverrides(Consumer<StateLinksConfigOverride> consumer) {
        if (stateLinksConfigOverrides.size() > 0) {
            for (StateLinksConfigOverride override : stateLinksConfigOverrides) {
                consumer.accept(override);
            }
        }
    }

    public void iterateParallelTaskOverrides(BiConsumer<String, ProjectParallelTaskGroupsConfig> consumer) {
        if (parallelTaskOverrides.size() > 0) {
            for (Map.Entry<String, ProjectParallelTaskGroupsConfig> entry : parallelTaskOverrides.entrySet()) {
                consumer.accept(entry.getKey(), entry.getValue());
            }
        }
    }

    Map<String, BoardProjectStateMapper> getStateLinkOverrides() {
        return stateLinkOverrides;
    }

    Map<String, ProjectParallelTaskGroupsConfig> getParallelTaskGroupsOverrides() {
        return parallelTaskOverrides;
    }


    static BoardProjectIssueTypeOverrideConfig load(
            ModelNode overridesNode, BoardStates boardStates,
            BoardParallelTaskConfig parallelTaskConfig, String projectCode, Set<String> existingIssueTypes) {
        List<StateLinksConfigOverride> stateLinksConfigOverrides = new ArrayList<>();
        List<ParallelTasksConfigOverride> parallelTasksConfigOverrides = new ArrayList<>();
        if (overridesNode.isDefined()) {
            loadStateLinksOverrides(stateLinksConfigOverrides, overridesNode, boardStates, projectCode, existingIssueTypes);
            loadParalleTaskGroupsOverrides(parallelTasksConfigOverrides, overridesNode, parallelTaskConfig, projectCode, existingIssueTypes);
        }

        return new BoardProjectIssueTypeOverrideConfig(stateLinksConfigOverrides, parallelTasksConfigOverrides);
    }

    private static void loadStateLinksOverrides(
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

    private static void loadParalleTaskGroupsOverrides(
            List<ParallelTasksConfigOverride> overrides, ModelNode overridesNode,
            BoardParallelTaskConfig parallelTaskConfig, String projectCode, Set<String> existingIssueTypes) {
        ModelNode parallelTasksNode = overridesNode.get(PARALLEL_TASKS);
        if (!parallelTasksNode.isDefined()) {
            return;
        }
        if (parallelTasksNode.getType() != ModelType.LIST) {
            throw new OverbaardValidationException("'overrides/parallel-tasks' for " + projectCode + " should be an array");
        }

        Set<String> issueTypes = new HashSet<>();
        for (ModelNode override : parallelTasksNode.asList()) {
            ParallelTasksConfigOverride linksOverride = ParallelTasksConfigOverride.load(override, parallelTaskConfig, projectCode, existingIssueTypes);
            for (String issueType : linksOverride.getIssueTypes()) {
                if (!issueTypes.add(issueType)) {
                    throw new OverbaardValidationException("Issue type '" + issueType + "' appears more than once in 'overrides/parallel-tasks' for " + projectCode);
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

        public ModelNode createEmptyNodeWithIssueTypesList() {
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


    public static class StateLinksConfigOverride extends IssueTypeConfigOverride {

        private final BoardProjectStateMapper stateMapper;


        private StateLinksConfigOverride(List<String> issueTypes, BoardProjectStateMapper stateMapper) {
            super(issueTypes);
            this.stateMapper = stateMapper;
        }

        public BoardProjectStateMapper getStateMapper() {
            return stateMapper;
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

    private static class ParallelTasksConfigOverride extends IssueTypeConfigOverride {
        private final ProjectParallelTaskGroupsConfig parallelTasks;

        public ParallelTasksConfigOverride(List<String> issueTypes, ProjectParallelTaskGroupsConfig parallelTasks) {
            super(issueTypes);
            this.parallelTasks = parallelTasks;
        }

        ModelNode serializeModelNodeForConfig() {
            ModelNode override = super.serializeModelNodeForConfig();
            if (parallelTasks != ProjectParallelTaskGroupsConfig.EMPTY_OVERRIDE) {
                override.get(OVERRIDE).set(parallelTasks.serializeForConfig());
            } else {
                override.get(OVERRIDE).set(new ModelNode());
            }
            return override;
        }


        static ParallelTasksConfigOverride load(ModelNode overrideNode, BoardParallelTaskConfig parallelTaskConfig, String projectCode, Set<String> existingIssueTypes) {
            ModelNode issueTypesNode = overrideNode.get(Constants.ISSUE_TYPES);
            List<String> issueTypes = loadAndValidateIssueTypes(issueTypesNode, projectCode, PARALLEL_TASKS, existingIssueTypes);
            ProjectParallelTaskGroupsConfig pts =
                    ProjectParallelTaskGroupsConfig.loadAndValidate(parallelTaskConfig, overrideNode.get(OVERRIDE), projectCode, issueTypes);
            return new ParallelTasksConfigOverride(issueTypes, pts);
        }

    }
}
