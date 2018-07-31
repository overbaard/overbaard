package org.overbaard.jira.impl.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.jboss.dmr.ModelType;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.impl.Constants;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class LinkedIssueFilterConfig {

    private final Set<String> projects;
    private final Set<String> issueTypes;
    private final Set<String> priorities;
    private final Set<String> labels;
    private final Set<String> linkNames;
    private final boolean emptyOverride;

    private LinkedIssueFilterConfig(Set<String> projects) {
        this(projects, null, null, null, null);
    }

    private LinkedIssueFilterConfig(Set<String> projects, Set<String> issueTypes, Set<String> priorities, Set<String> labels, Set<String> linkNames) {
        this.projects = projects;
        this.issueTypes = issueTypes;
        this.priorities = priorities;
        this.labels = labels;
        this.linkNames = linkNames;
        this.emptyOverride = (this.issueTypes == null || this.priorities == null || this.labels == null || this.linkNames == null);
    }

    static Map<String, LinkedIssueFilterConfig> convertToMap(List<LinkedIssueFilterConfig> list) {
        Map<String, LinkedIssueFilterConfig> map = new HashMap<>();
        for (LinkedIssueFilterConfig cfg : list) {
            for (String project : cfg.projects) {
                map.put(project, cfg);
            }
        }
        return Collections.unmodifiableMap(map);
    }

    static LinkedIssueFilterConfig loadForBoardProject(
            Set<String> linkedProjectNames, String owningProjectCode, ModelNode linkedIssueConfig) {
        return load(linkedProjectNames, "for linked-issues in " + "project['" + owningProjectCode + "']", linkedIssueConfig, false);
    }

    static LinkedIssueFilterConfig loadForBoardProjectIssueTypeOverride(
            Set<String> linkedProjectNames, String owningProjectCode, List<String> issueTypes, ModelNode linkedIssueConfig) {
        return load(linkedProjectNames,"override" + issueTypes + "for linked-issues/filter in " + "project['" + owningProjectCode + "']", linkedIssueConfig, true);
    }

    private static LinkedIssueFilterConfig load(Set<String> linkedProjectNames, String location, ModelNode linkedIssueConfig, boolean override) {
        Set<String> projects = loadStringSet(Constants.PROJECTS, location, linkedIssueConfig);
        if (projects.size() == 0) {
            throw new OverbaardValidationException("'projects' in " + location + " must contain at least one project");
        }

        ModelNode filterNode = new ModelNode();
        if (linkedIssueConfig.hasDefined(Constants.FILTER)) {
            filterNode = linkedIssueConfig.get(Constants.FILTER);
        }
        if (filterNode.getType() != ModelType.OBJECT) {
            if (!filterNode.isDefined() && override) {
                return new LinkedIssueFilterConfig(projects);
            }
            throw new OverbaardValidationException("'filter' " + location + " must be a map");
        }

        for (String project : projects) {
            if (!linkedProjectNames.contains(project)) {
                throw new OverbaardValidationException("'projects' in 'filter' " + location + " references an unknown linked-project " + project);
            }
        }

        Set<String> issueTypes = loadStringSet(Constants.ISSUE_TYPES, location, filterNode);
        Set<String> priorities = loadStringSet(Constants.PRIORITIES, location, filterNode);
        Set<String> labels = loadStringSet(Constants.LABELS, location, filterNode);
        Set<String> linkNames = loadStringSet(Constants.LINK_NAMES, location, filterNode);
        return new LinkedIssueFilterConfig(projects, issueTypes, priorities, labels, linkNames);
    }

    private static Set<String> loadStringSet(String name, String location, ModelNode filterNode) {
        ModelNode arrayNode = filterNode.get(name);
        if (!arrayNode.isDefined()) {
            return Collections.emptySet();
        }
        if (arrayNode.getType() != ModelType.LIST) {
            throw new OverbaardValidationException(name + " in " + location + " must be an array of strings");
        }
        Set<String> values = new LinkedHashSet<>();
        for (ModelNode value : arrayNode.asList()) {
            values.add(value.asString());
        }
        return Collections.unmodifiableSet(values);
    }

    public boolean isEmptyOverride() {
        return emptyOverride;
    }

    public Set<String> getProjects() {
        return projects;
    }

    public Set<String> getIssueTypes() {
        return issueTypes;
    }

    public Set<String> getPriorities() {
        return priorities;
    }

    public Set<String> getLabels() {
        return labels;
    }

    public Set<String> getLinkNames() {
        return linkNames;
    }

    public ModelNode serializeModelNodeForConfig() {
        ModelNode override = new ModelNode();
        serializeStringSet(override, Constants.PROJECTS, projects);
        ModelNode filter = new ModelNode();
        if (!emptyOverride) {
            filter.setEmptyObject();
            serializeStringSet(filter, Constants.ISSUE_TYPES, issueTypes);
            serializeStringSet(filter, Constants.PRIORITIES, priorities);
            serializeStringSet(filter, Constants.LABELS, labels);
            serializeStringSet(filter, Constants.LINK_NAMES, linkNames);
        }
        override.get(Constants.FILTER).set(filter);
        return override;
    }

    private void serializeStringSet(ModelNode modelNode, String key, Set<String> set) {
        if (set.size() > 0) {
            ModelNode list = new ModelNode();
            list.setEmptyList();
            for (String name : set) {
                list.add(name);
            }
            modelNode.get(key).set(list);
        }
    }
}
