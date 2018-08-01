package org.overbaard.jira.impl.config;

import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.LINKED_ISSUES;
import static org.overbaard.jira.impl.Constants.OVERRIDE;
import static org.overbaard.jira.impl.Constants.PARALLEL_TASKS;
import static org.overbaard.jira.impl.Constants.STATE_LINKS;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardProjectIssueTypeOverrideConfig {
    private final List<StateLinksConfigOverride> stateLinksConfigOverrides;
    private final List<ParallelTasksConfigOverride> parallelTasksConfigOverrides;
    private final List<LinkedIssueFilterConfigOverride> linkedIssuesConfigOverrides;

    private final Map<String, BoardProjectStateMapper> stateLinkOverrides;
    private final Map<String, ProjectParallelTaskGroupsConfig> parallelTaskOverrides;
    private final Map<String, Map<String, LinkedIssueFilterConfig>> linkedIssueFilters;

    private BoardProjectIssueTypeOverrideConfig(
            List<StateLinksConfigOverride> configOverrides,
            List<ParallelTasksConfigOverride> parallelTasksConfigOverrides,
            List<LinkedIssueFilterConfigOverride> linkedIssuesConfigOverrides) {
        this.stateLinksConfigOverrides = Collections.unmodifiableList(configOverrides);
        this.parallelTasksConfigOverrides = Collections.unmodifiableList(parallelTasksConfigOverrides);
        this.linkedIssuesConfigOverrides = Collections.unmodifiableList(linkedIssuesConfigOverrides);

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

        Map<String, Map<String, LinkedIssueFilterConfig>> linkedIssueFilters = new HashMap<>();
        for (LinkedIssueFilterConfigOverride override : linkedIssuesConfigOverrides) {
            for (String issueType : override.getIssueTypes()) {
                Map<String, LinkedIssueFilterConfig> byProject = new HashMap<>();
                for (LinkedIssueFilterConfig config : override.filters) {
                    for (String project : config.getProjects()) {
                        byProject.put(project, config);
                    }
                }
                linkedIssueFilters.put(issueType, Collections.unmodifiableMap(byProject));
            }
        }
        this.linkedIssueFilters = Collections.unmodifiableMap(linkedIssueFilters);
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
        if (linkedIssuesConfigOverrides.size() > 0) {
            for (LinkedIssueFilterConfigOverride override : linkedIssuesConfigOverrides) {
                modelNode.get(LINKED_ISSUES).add(override.serializeModelNodeForConfig());
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

    Map<String, LinkedIssueFilterConfig> getLinkedIssueFilters(String issueType) {
        return linkedIssueFilters.get(issueType);
    }

    static BoardProjectIssueTypeOverrideConfig load(
            ModelNode overridesNode, BoardStates boardStates,
            BoardParallelTaskConfig parallelTaskConfig,
            String projectCode,
            Set<String> existingIssueTypes,
            Set<String> linkedProjectNames) {
        List<StateLinksConfigOverride> stateLinksConfigOverrides = new ArrayList<>();
        List<ParallelTasksConfigOverride> parallelTasksConfigOverrides = new ArrayList<>();
        List<LinkedIssueFilterConfigOverride> linkedIssueFilterConfigOverrides = new ArrayList<>();
        if (overridesNode.isDefined()) {
            loadStateLinksOverrides(stateLinksConfigOverrides, overridesNode, boardStates, projectCode, existingIssueTypes);
            loadParalleTaskGroupsOverrides(parallelTasksConfigOverrides, overridesNode, parallelTaskConfig, projectCode, existingIssueTypes);
            loadLinkedIssueFilterOverrides(linkedIssueFilterConfigOverrides, overridesNode, projectCode, existingIssueTypes, linkedProjectNames);
        }

        return new BoardProjectIssueTypeOverrideConfig(stateLinksConfigOverrides, parallelTasksConfigOverrides, linkedIssueFilterConfigOverrides);
    }

    private static void loadStateLinksOverrides(
            List<StateLinksConfigOverride> overrides, ModelNode overridesNode,
            BoardStates boardStates, String projectCode, Set<String> existingIssueTypes) {
        loadOverrides(overrides, overridesNode, STATE_LINKS, projectCode, new OverrideLoader<StateLinksConfigOverride>() {
            @Override
            public StateLinksConfigOverride load(ModelNode override) {
                return StateLinksConfigOverride.load(override, boardStates, projectCode, existingIssueTypes);
            }
        });
    }

    private static void loadParalleTaskGroupsOverrides(
            List<ParallelTasksConfigOverride> overrides, ModelNode overridesNode,
            BoardParallelTaskConfig parallelTaskConfig, String projectCode, Set<String> existingIssueTypes) {
        loadOverrides(overrides, overridesNode, PARALLEL_TASKS, projectCode, new OverrideLoader<ParallelTasksConfigOverride>() {
            @Override
            public ParallelTasksConfigOverride load(ModelNode override) {
                return ParallelTasksConfigOverride.load(override, parallelTaskConfig, projectCode, existingIssueTypes);
            }
        });
    }

    private static void loadLinkedIssueFilterOverrides(
            List<LinkedIssueFilterConfigOverride> overrides, ModelNode overridesNode,
            String projectCode, Set<String> existingIssueTypes, Set<String> linkedProjectNames) {
        loadOverrides(overrides, overridesNode, LINKED_ISSUES, projectCode, new OverrideLoader<LinkedIssueFilterConfigOverride>() {
            @Override
            public LinkedIssueFilterConfigOverride load(ModelNode override) {
                return LinkedIssueFilterConfigOverride.load(override, linkedProjectNames, projectCode, existingIssueTypes);
            }
        });

    }

    private static <T extends IssueTypeConfigOverride> void loadOverrides(
            List<T> overrides, ModelNode overridesNode, String overrideType, String projectCode, OverrideLoader<T> loader) {
        if (overridesNode.getType() != ModelType.OBJECT) {
            throw new OverbaardValidationException("'overrides' for " + projectCode + " should be a map");
        }
        ModelNode overridesOfTypeNode = overridesNode.get(overrideType);
        if (!overridesOfTypeNode.isDefined()) {
            return;
        }
        if (overridesOfTypeNode.getType() != ModelType.LIST) {
            throw new OverbaardValidationException("'overrides/" + overrideType +"' for " + projectCode + " should be an array");
        }

        Set<String> issueTypes = new HashSet<>();
        for (ModelNode override : overridesOfTypeNode.asList()) {
            T linksOverride = loader.load(override);
            for (String issueType : linksOverride.getIssueTypes()) {
                if (!issueTypes.add(issueType)) {
                    throw new OverbaardValidationException("Issue type '" + issueType + "' appears more than once in 'overrides/" +
                            overrideType + "' for " + projectCode);
                }
            }
            overrides.add(linksOverride);
        }
    }

    private interface OverrideLoader<T extends IssueTypeConfigOverride> {
        T load(ModelNode override);
    }

    private abstract static class IssueTypeConfigOverride {
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

    private static class LinkedIssueFilterConfigOverride extends IssueTypeConfigOverride {
        private final List<LinkedIssueFilterConfig> filters;

        public LinkedIssueFilterConfigOverride(List<String> issueTypes, List<LinkedIssueFilterConfig> filters) {
            super(issueTypes);
            this.filters = filters;
        }

        ModelNode serializeModelNodeForConfig() {
            ModelNode override = super.serializeModelNodeForConfig();
            ModelNode overrideNode = override.get(OVERRIDE);
            overrideNode.setEmptyList();
            for (LinkedIssueFilterConfig entry : filters) {
                overrideNode.add(entry.serializeModelNodeForConfig());
            }
            return override;
        }

        static LinkedIssueFilterConfigOverride load(ModelNode overrideNode, Set<String> linkedProjectNames, String projectCode, Set<String> existingIssueTypes) {
            ModelNode issueTypesNode = overrideNode.get(Constants.ISSUE_TYPES);
            List<String> issueTypes = loadAndValidateIssueTypes(issueTypesNode, projectCode, LINKED_ISSUES, existingIssueTypes);
            ModelNode override = overrideNode.get(OVERRIDE);
            if (override.getType() != ModelType.LIST) {
                throw new OverbaardValidationException("linked-issues override for issue-types=" + issueTypes + " in project '" + projectCode + "' must be an array");
            }

            Set<String> seenProjects = new HashSet<>();
            List<LinkedIssueFilterConfig> filters = new ArrayList<>();

            for (ModelNode curr : override.asList()) {
                if (curr.getType() != ModelType.OBJECT) {
                    throw new OverbaardValidationException("linked-issues override entry for issue-types=" + issueTypes + " in project '" + projectCode + "' must be a map");
                }
                LinkedIssueFilterConfig filterConfig =
                        LinkedIssueFilterConfig.loadForBoardProjectIssueTypeOverride(linkedProjectNames, projectCode, issueTypes, curr);
                for (String project : filterConfig.getProjects()) {
                    if (!seenProjects.add(project)) {
                        throw new OverbaardValidationException(
                                "linked-issues override entry for issue-types=" + issueTypes + " in project '" +
                                        projectCode + "' uses project '" + project + "' more than once");
                    }
                }
                filters.add(filterConfig);
            }
            return new LinkedIssueFilterConfigOverride(issueTypes, Collections.unmodifiableList(filters));
        }

    }

}
