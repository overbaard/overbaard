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

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.config.BoardConfig;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.LinkedProjectConfig;
import org.overbaard.jira.impl.config.ParallelTaskGroupPosition;
import org.overbaard.jira.impl.config.ProjectConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;
import org.overbaard.jira.impl.util.IndexedMap;

import com.atlassian.jira.issue.CustomFieldManager;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.jira.issue.link.IssueLink;
import com.atlassian.jira.issue.link.IssueLinkManager;
import com.atlassian.jira.util.Consumer;

/**
 * The data for an issue on the board
 *
 * @author Kabir Khan
 */
public abstract class Issue {

    private final ProjectConfig project;
    private final String key;
    private final String state;
    private final Integer stateIndex;
    private final String summary;
    private final String issueTypeName;

    Issue(ProjectConfig project, String key, String state, Integer stateIndex, String issueTypeName, String summary) {
        this.project = project;
        this.key = key;
        this.state = state;
        this.stateIndex = stateIndex;
        this.summary = summary;
        this.issueTypeName = issueTypeName;
    }

    public String getKey() {
        return key;
    }

    public String getState() {
        return state;
    }

    public String getSummary() {
        return summary;
    }

    public String getProjectCode() {
        return project.getCode();
    }

    Integer getStateIndex() {
        return stateIndex;
    }

    public String getIssueTypeName() {
        return issueTypeName;
    }

    boolean hasLinkedIssues() {
        return false;
    }

    String getEpicKey() {
        return null;
    }

    Iterable<LinkedIssue> getLinkedIssues() {
        return () -> Collections.<LinkedIssue>emptySet().iterator();
    }

    ModelNode getModelNodeForFullRefresh(Board board) {
        ModelNode issueNode = getBaseModelNode();
        return issueNode;
    }

    private ModelNode getBaseModelNode() {
        ModelNode issueNode = new ModelNode();
        issueNode.get(Constants.KEY).set(key);
        issueNode.get(Constants.STATE).set(project.getProjectStatesLinks(issueTypeName).getStateIndex(state));
        issueNode.get(Constants.SUMMARY).set(summary);
        return issueNode;
    }

    /**
     * Returns a builder for the board issues during a full load of the board. Linked issues are handled internally.
     *
     * @param project the builder for the project containing the issues
     * @return the builder
     */
    static Builder builder(BoardProject.Accessor project, IssueLoadStrategy issueLoadStrategy) {
        return new Builder(project, issueLoadStrategy);
    }

    /**
     * Creates a new issue. If the issue is for a state, priority or issue type not configured,
     * {@code null} will be returned, having updated the 'missing' maps in Board.
     *
     * @param project                 the project the issue belongs to
     * @param issueKey                the issue's key
     * @param state                   the issue's state id
     * @param summary                 the issue summary
     * @param issueType               the issue's type
     * @param priority                the priority
     * @param assignee                the assignee
     * @param components              the components
     * @param labels                  the labels
     * @param fixVersions             the fix versions
     * @param customFieldValues       the custom field values
     * @param parallelTaskGroupValues the parallel task group values
     * @return the issue
     */
    static Issue createForCreateEvent(BoardProject.Accessor project, String issueKey, String state,
                                      String summary, String issueType, String priority, Assignee assignee,
                                      Set<MultiSelectNameOnlyValue.Component> components, Set<MultiSelectNameOnlyValue.Label> labels, Set<MultiSelectNameOnlyValue.FixVersion> fixVersions,
                                      Map<String, CustomFieldValue> customFieldValues,
                                      Map<ParallelTaskGroupPosition, Integer> parallelTaskGroupValues) {
        Builder builder = new Builder(project, issueKey);
        builder.setState(issueType, state);
        builder.setSummary(summary);
        builder.setIssueType(issueType);
        builder.setPriority(priority);
        builder.setAssignee(assignee);
        builder.setComponents(components);
        builder.setLabels(labels);
        builder.setFixVersions(fixVersions);
        builder.setCustomFieldValues(customFieldValues);
        builder.setParallelTaskGroupValues(parallelTaskGroupValues);

        //TODO parallel task values

        //TODO linked issues

        // TODO Epic and parent issues
        return builder.build();
    }

    /**
     * Creates a new issue based on an {@code existing} one. The data is then updated with the results of
     * {@code issueType}, {@code priority}, {@code summary}, {@code issueAssignee}, {@code rankOrStateChanged}
     * {@code state} if they are different from the current issue detail. Note that the update event might be raised
     * for fields we are not interested in, in which case we don't care about the change, and return {@code null}.If
     * the issue is for a state, priority or issue type not configured, {@code null} will be returned, having
     * updated the 'missing' maps in Board.
     * @param project the project the issue belongs to
     * @param existing the issue to update
     * @param issueType the new issue type
     * @param priority the new issue priority
     * @param summary the new issue summary
     * @param issueAssignee the new issue assignee
     * @param issueComponents the new issue components
     * @param labels the new issue labels
     * @param fixVersions the new issue fix versions
     * @param state the state of the issue  @return the new issue
     * @param customFieldValues the custom field values
     * @param parallelTaskGroupValues the parallel task group values
     */
    static Issue copyForUpdateEvent(BoardProject.Accessor project, Issue existing, String issueType, String priority,
                                    String summary, Assignee issueAssignee, Set<MultiSelectNameOnlyValue.Component> issueComponents,
                                    Set<MultiSelectNameOnlyValue.Label> labels, Set<MultiSelectNameOnlyValue.FixVersion> fixVersions,
                                    String state, Map<String, CustomFieldValue> customFieldValues,
                                    Map<ParallelTaskGroupPosition, Integer> parallelTaskGroupValues) {
        if (existing instanceof BoardIssue == false) {
            return null;
        }
        return copyForUpdateEvent(project, (BoardIssue)existing, issueType, priority,
                summary, issueAssignee, issueComponents, labels, fixVersions, state,
                customFieldValues, parallelTaskGroupValues);
    }

    private static Issue copyForUpdateEvent(BoardProject.Accessor project, BoardIssue existing, String issueType, String priority,
                                            String summary, Assignee issueAssignee, Set<MultiSelectNameOnlyValue.Component> issueComponents,
                                            Set<MultiSelectNameOnlyValue.Label> labels, Set<MultiSelectNameOnlyValue.FixVersion> fixVersions,
                                            String state, Map<String, CustomFieldValue> customFieldValues,
                                            Map<ParallelTaskGroupPosition, Integer> parallelTaskGroupValues) {
        Builder builder = new Builder(project, existing);
        boolean changed = false;
        if (issueType != null) {
            builder.setIssueType(issueType);
            changed = true;
        }
        if (priority != null) {
            builder.setPriority(priority);
            changed = true;
        }
        if (summary != null) {
            builder.setSummary(summary);
            changed = true;
        }
        if (issueAssignee != null) {
            //A non-null assignee means it was updated, either to an assignee or unassigned.
            if (issueAssignee == Assignee.UNASSIGNED) {
                builder.setAssignee(null);
                changed = true;
            } else {
                builder.setAssignee(issueAssignee);
                changed = true;
            }
        }
        if (issueComponents != null) {
            //A non-null component means it was updated.
            if (issueComponents.size() == 0) {
                builder.setComponents(null);
                changed = true;
            } else {
                builder.setComponents(issueComponents);
                changed = true;
            }
        }
        if (labels != null) {
            //A non-null labels means it was updated
            if (labels.size() == 0) {
                builder.setLabels(null);
                changed = true;
            } else {
                builder.setLabels(labels);
                changed = true;
            }
        }
        if (fixVersions != null) {
            //A non-null labels means it was updated
            if (fixVersions.size() == 0) {
                builder.setFixVersions(null);
                changed = true;
            } else {
                builder.setFixVersions(fixVersions);
                changed = true;
            }
        }
        if (state != null) {
            changed = true;
            String currentIssueType = issueType != null ? issueType : existing.getIssueTypeName();
            builder.setState(currentIssueType, state);
        }
        if (customFieldValues.size() > 0) {
            changed = true;
            builder.setCustomFieldValues(customFieldValues);
        }
        if (parallelTaskGroupValues.size() > 0) {
            changed = true;
            builder.setParallelTaskGroupValues(parallelTaskGroupValues);
        } else {
            if (issueType != null) {
                // When changing the issue type, we always overwrite the PT fields. If the list of PT values
                // is empty, it means we need to clear it
                builder.clearParallelTaskGroupValues();
            }

        }
        if (changed) {
            return builder.build();
        }
        return null;
    }

    abstract BoardChangeRegistry.IssueChange convertToCreateIssueChange(BoardChangeRegistry registry, BoardConfig boardConfig);

    static class BoardIssue extends Issue {
        private final Assignee assignee;
        private final Set<MultiSelectNameOnlyValue.Component> components;
        private final Set<MultiSelectNameOnlyValue.Label> labels;
        private final Set<MultiSelectNameOnlyValue.FixVersion> fixVersions;
        /** The index of the issue type in the owning board config */
        private final Integer issueTypeIndex;
        /** The index of the priority in the owning board config */
        private final Integer priorityIndex;
        private final String parentIssueKey;
        private final String epicKey;
        private final Integer epicIndex;
        private final List<LinkedIssue> linkedIssues;
        private final Map<String, CustomFieldValue> customFieldValues;
        private final List<List<Integer>> parallelTaskFieldGroupValues;

        public BoardIssue(BoardProjectConfig project, String key, String state, Integer stateIndex, String summary,
                          Integer issueTypeIndex, String issueTypeName, Integer priorityIndex, Assignee assignee,
                          Set<MultiSelectNameOnlyValue.Component> components, Set<MultiSelectNameOnlyValue.Label> labels,
                          Set<MultiSelectNameOnlyValue.FixVersion> fixVersions,
                          String parentIssueKey, String epicKey, Integer epicIndex, List<LinkedIssue> linkedIssues,
                          Map<String, CustomFieldValue> customFieldValues,
                          List<List<Integer>> parallelTaskFieldGroupValues) {
            super(project, key, state, stateIndex, issueTypeName, summary);
            this.issueTypeIndex = issueTypeIndex;
            this.priorityIndex = priorityIndex;
            this.assignee = assignee;
            this.components = components;
            this.labels = labels;
            this.fixVersions = fixVersions;
            this.parentIssueKey = parentIssueKey;
            this.epicKey = epicKey;
            this.epicIndex = epicIndex;
            this.linkedIssues = linkedIssues;
            this.customFieldValues = customFieldValues;
            this.parallelTaskFieldGroupValues = parallelTaskFieldGroupValues;
        }

        @Override
        public String getEpicKey() {
            return epicKey;
        }

        boolean hasLinkedIssues() {
            return linkedIssues.size() > 0;
        }

        Iterable<LinkedIssue> getLinkedIssues() {
            return linkedIssues::iterator;
        }

        @Override
        ModelNode getModelNodeForFullRefresh(Board board) {
            final BoardProject boardProject = board.getBoardProject(getProjectCode());
            final ModelNode issueNode = super.getModelNodeForFullRefresh(board);
            issueNode.get(Constants.PRIORITY).set(priorityIndex);
            issueNode.get(Constants.TYPE).set(issueTypeIndex);
            if (assignee != null) {
                //This map will always be populated
                issueNode.get(Constants.ASSIGNEE).set(boardProject.getAssigneeIndex(assignee));
            }
            if (components != null) {
                components.forEach(component -> issueNode.get(Constants.COMPONENTS).add(boardProject.getComponentIndex(component)));
            }
            if (labels != null) {
                labels.forEach(label -> issueNode.get(Constants.LABELS).add(boardProject.getLabelIndex(label)));
            }
            if (fixVersions != null) {
                fixVersions.forEach(fixVersion -> issueNode.get(Constants.FIX_VERSIONS).add(boardProject.getFixVersionIndex(fixVersion)));
            }
            if (customFieldValues.size() > 0) {
                final ModelNode custom = issueNode.get(Constants.CUSTOM);
                customFieldValues.values().forEach(
                        customFieldValue -> custom.get(customFieldValue.getCustomFieldName()).set(boardProject.getCustomFieldValueIndex(customFieldValue)));
            }
            if (parallelTaskFieldGroupValues != null) {
                final ModelNode parallel = issueNode.get(Constants.PARALLEL_TASKS).setEmptyList();
                parallelTaskFieldGroupValues.forEach(group -> {
                    ModelNode groupNode = new ModelNode().setEmptyList();
                    group.forEach(value -> {
                        groupNode.add(value);
                    });
                    parallel.add(groupNode);
                });
            }

            if (hasLinkedIssues()) {
                final ModelNode linkedIssuesNode = issueNode.get(Constants.LINKED_ISSUES);
                linkedIssues.forEach(linkedIssue -> linkedIssuesNode.add(linkedIssue.getModelNodeForFullRefresh(board)));
            }
            if (parentIssueKey != null) {
                issueNode.get(Constants.PARENT).set(parentIssueKey);
            }
            if (epicIndex != null) {
                issueNode.get(Constants.EPIC).set(epicIndex);
            }

            return issueNode;
        }

        @Override
        BoardChangeRegistry.IssueChange convertToCreateIssueChange(BoardChangeRegistry registry, BoardConfig boardConfig) {
            String issueType = boardConfig.getIssueTypeName(issueTypeIndex);
            String priority = boardConfig.getPriorityName(priorityIndex);
            return registry.createCreateIssueChange(this, assignee, issueType, priority, components, labels, fixVersions);
        }
    }

    private static class LinkedIssue extends Issue {
        private final LinkedProjectConfig project;

        public LinkedIssue(LinkedProjectConfig project, String key, String state, Integer stateIndex, String issueTypeName, String summary) {
            super(project, key, state, stateIndex, issueTypeName, summary);
            this.project = project;
        }

        @Override
        BoardChangeRegistry.IssueChange convertToCreateIssueChange(BoardChangeRegistry registry, BoardConfig boardConfig) {
            throw new IllegalStateException("Not for linked issues");
        }

        @Override
        ModelNode getModelNodeForFullRefresh(Board board) {
            ModelNode node = super.getModelNodeForFullRefresh(board);
            if (this.project.hasTypeLinks(getIssueTypeName())) {
                // We are for an overridden state so only set this if it is one of those
                node.get(Constants.TYPE).set(getIssueTypeName());
            }
            return node;
        }
    }

    /**
     * The builder for the board issues
     */
    static class Builder {
        private final BoardProject.Accessor project;

        private final IssueLoadStrategy issueLoadStrategy;
        private String issueKey;
        private String summary;
        private Assignee assignee;
        private Set<MultiSelectNameOnlyValue.Component> components;
        private Set<MultiSelectNameOnlyValue.Label> labels;
        private Set<MultiSelectNameOnlyValue.FixVersion> fixVersions;
        private Integer issueTypeIndex;
        private String issueTypeName;
        private Integer priorityIndex;
        private String state;
        private Integer stateIndex;
        private String parentIssueKey;
        private String epicKey;
        private Integer epicIndex;
        private Set<LinkedIssue> linkedIssues;
        //Will only be set for an update
        private Map<String, CustomFieldValue> originalCustomFieldValues;
        private Map<String, CustomFieldValue> customFieldValues;

        //Will only be set for an update
        private List<List<Integer>> originalParallelTaskGroupValues;
        private Integer[][] parallelTaskGroupValues;
        private boolean clearParallelTaskGroupValues;

        private Builder(BoardProject.Accessor project, IssueLoadStrategy issueLoadStrategy) {
            this.project = project;
            this.issueKey = null;
            this.issueLoadStrategy = issueLoadStrategy == null ? new LazyLoadStrategy(project) : issueLoadStrategy;
        }

        private Builder(BoardProject.Accessor project, String issueKey) {
            //Used when handling a create event for an issue
            this.project = project;
            this.issueKey = issueKey;
            this.issueLoadStrategy = new LazyLoadStrategy(project);
        }

        private Builder(BoardProject.Accessor project, BoardIssue existing) {
            //Used when handling an update event for an issue
            this.project = project;
            this.issueKey = existing.getKey();
            this.issueLoadStrategy = new LazyLoadStrategy(project);
            this.summary = existing.getSummary();
            this.assignee = existing.assignee;
            this.components = existing.components;
            this.labels = existing.labels;
            this.fixVersions = existing.fixVersions;
            this.issueTypeIndex = existing.issueTypeIndex;
            this.issueTypeName = existing.getIssueTypeName();
            this.priorityIndex = existing.priorityIndex;
            this.state = existing.getState();
            this.stateIndex = existing.getStateIndex();
            this.parentIssueKey = existing.parentIssueKey;
            this.epicKey = existing.epicKey;
            this.epicIndex = existing.epicIndex;
            if (existing.linkedIssues.size() > 0) {
                Set<LinkedIssue> linkedIssues = createLinkedIssueSet();
                linkedIssues.addAll(existing.linkedIssues);
                this.linkedIssues = Collections.unmodifiableSet(linkedIssues);
            } else {
                this.linkedIssues = Collections.emptySet();
            }
            this.originalCustomFieldValues = existing.customFieldValues;
            this.originalParallelTaskGroupValues = existing.parallelTaskFieldGroupValues;
        }

        void load(com.atlassian.jira.issue.Issue issue) {
            issueKey = issue.getKey();
            summary = issue.getSummary();
            assignee = project.getAssignee(issue.getAssignee());
            components = project.getComponents(issue.getComponentObjects());
            labels = project.getLabels(issue.getLabels());
            fixVersions = project.getFixVersions(issue.getFixVersions());
            setIssueType(issue.getIssueTypeObject().getName());
            setPriority(issue.getPriorityObject().getName());
            setState(this.issueTypeName, issue.getStatusObject().getName());

            //Load the custom fields, epics and parents
            issueLoadStrategy.handle(issue, this);

            final IssueLinkManager issueLinkManager = project.getIssueLinkManager();
            addLinkedIssues(issueLinkManager.getOutwardLinks(issue.getId()), true);
            addLinkedIssues(issueLinkManager.getInwardLinks(issue.getId()), false);
        }

        private Builder setIssueKey(String issueKey) {
            this.issueKey = issueKey;
            return this;
        }

        private Builder setSummary(String summary) {
            this.summary = summary;
            return this;
        }

        private Builder setAssignee(Assignee assignee) {
            this.assignee = assignee == Assignee.UNASSIGNED ? null : assignee;
            return this;
        }

        private Builder setComponents(Set<MultiSelectNameOnlyValue.Component> components) {
            return setMultiSelectNameOnlyValue(components, set -> this.components = set);
        }

        private Builder setLabels(Set<MultiSelectNameOnlyValue.Label> labels) {
            return setMultiSelectNameOnlyValue(labels, set -> this.labels = set);
        }

        private Builder setFixVersions(Set<MultiSelectNameOnlyValue.FixVersion> fixVersions) {
            return setMultiSelectNameOnlyValue(fixVersions, set -> this.fixVersions = set);
        }

        private <T extends MultiSelectNameOnlyValue> Builder setMultiSelectNameOnlyValue(
                Set<T> values, Consumer<Set<T>> consumer) {
            if (values == null || values.size() == 0) {
                consumer.consume(null);
            } else {
                consumer.consume(values);
            }
            return this;
        }

        private Builder setIssueType(String issueTypeName) {
            this.issueTypeIndex = project.getIssueTypeIndexRecordingMissing(issueKey, issueTypeName);
            if (this.issueTypeIndex != null) {
                this.issueTypeName = project.getBoard().getConfig().getIssueTypeName(this.issueTypeIndex);
            }
            return this;
        }

        private Builder setPriority(String priorityName) {
            this.priorityIndex = project.getPriorityIndexRecordingMissing(issueKey, priorityName);
            return this;
        }

        private Builder setState(String issueType, String stateName) {
            state = stateName;
            stateIndex = project.getStateIndexRecordingMissing(issueKey, issueType, state);
            return this;
        }

        private void addLinkedIssues(List<IssueLink> links, boolean outbound) {
            if (links == null) {
                return;
            }
            if (links.size() == 0) {
                return;
            }
            for (IssueLink link : links) {
                com.atlassian.jira.issue.Issue linkedIssue = outbound ? link.getDestinationObject() : link.getSourceObject();
                String linkedProjectKey = linkedIssue.getProjectObject().getKey();
                BoardProject.LinkedProjectContext linkedProjectContext = project.getLinkedProjectContext(linkedProjectKey);
                if (linkedProjectContext == null) {
                    //This was not set up as one of the linked projects we are interested in
                    continue;
                }

                String linkName = outbound ? link.getIssueLinkType().getOutward() : link.getIssueLinkType().getInward();
                LinkedIssueFilterUtil filter = new LinkedIssueFilterUtil(project.getConfig(), issueTypeName, linkName, linkedIssue, linkedProjectKey);
                if (!filter.includeIssue()) {
                    // We do not match the filter
                    continue;
                }

                String stateName = linkedIssue.getStatusObject().getName();
                Integer stateIndex = linkedProjectContext.getStateIndexRecordingMissing(linkedIssue.getKey(), linkedIssue.getIssueType().getName(), stateName);

                if (stateIndex != null) {
                    if (linkedIssues == null) {
                        linkedIssues = createLinkedIssueSet();
                    }
                    linkedIssues.add(new LinkedIssue(linkedProjectContext.getConfig(), linkedIssue.getKey(),
                            stateName, stateIndex, linkedIssue.getIssueType().getName(), linkedIssue.getSummary()));
                }
            }
        }

        private TreeSet<LinkedIssue> createLinkedIssueSet() {
            return new TreeSet<>(new Comparator<LinkedIssue>() {
                @Override
                public int compare(LinkedIssue o1, LinkedIssue o2) {
                    return o1.getKey().compareTo(o2.getKey());
                }
            });
        }

        Issue build() {
            issueLoadStrategy.finish();
            if (issueTypeIndex != null && priorityIndex != null && stateIndex != null) {

                // issueLoadStrategy.finish() above will set this the epicKey and load up the indices of the epics
                this.epicIndex = project.getEpicIndex(epicKey);

                List<LinkedIssue> linkedList = linkedIssues == null ?
                        Collections.emptyList() : Collections.unmodifiableList(new ArrayList<>(linkedIssues));

                return new BoardIssue(
                        project.getConfig(), issueKey, state, stateIndex, summary,
                        issueTypeIndex, issueTypeName, priorityIndex, assignee, components,
                        labels, fixVersions,
                        parentIssueKey, epicKey, epicIndex, linkedList,
                        mergeCustomFieldValues(),
                        mergeParallelTaskFieldGroupValues());
            }
            return null;
        }

        private Map<String, CustomFieldValue> mergeCustomFieldValues() {
            if (originalCustomFieldValues == null) {
                //We are creating a new issue
                return customFieldValues == null ? Collections.emptyMap() : Collections.unmodifiableMap(customFieldValues);
            } else {
                if (customFieldValues == null) {
                    return originalCustomFieldValues;
                }
                Map<String, CustomFieldValue> merged = new HashMap<>(originalCustomFieldValues);
                customFieldValues.entrySet().forEach(entry -> {
                    if (entry.getValue() == null) {
                        merged.remove(entry.getKey());
                    } else {
                        merged.put(entry.getKey(), entry.getValue());
                    }});

                return Collections.unmodifiableMap(merged);
            }
        }

        private List<List<Integer>> mergeParallelTaskFieldGroupValues() {
            if (originalParallelTaskGroupValues == null) {
                // We are creating a new issue
                initialiseParallelTaskGroupValues();
                if (parallelTaskGroupValues == null) {
                    return null;
                }
                List<List<Integer>> values = new ArrayList<>();
                for (int i = 0 ; i < parallelTaskGroupValues.length ; i++) {
                    Integer[] group = parallelTaskGroupValues[i];
                    List<Integer> groupValues = new ArrayList<>();
                    for (int j = 0 ; j < group.length ; j++) {
                        Integer val = group[j];
                        if (val == null) {
                            val = 0;
                        }
                        groupValues.add(val);
                    }
                    values.add(Collections.unmodifiableList(groupValues));
                }
                return Collections.unmodifiableList(values);
            } else {
                if (parallelTaskGroupValues == null) {
                    if (clearParallelTaskGroupValues) {
                        return null;
                    } else {
                        return originalParallelTaskGroupValues;
                    }
                }
                List<List<Integer>> merged = new ArrayList<>();
                for (int i = 0; i < parallelTaskGroupValues.length; i++) {
                    Integer[] newGroup = parallelTaskGroupValues[i];
                    List<Integer> mergedGroupValues = new ArrayList<>();
                    for (int j = 0 ; j < newGroup.length ; j++) {
                        Integer newVal = newGroup[j];
                        if (newVal != null) {
                            mergedGroupValues.add(newVal);
                        } else {
                            mergedGroupValues.add(originalParallelTaskGroupValues.get(i).get(j));
                        }
                    }
                    merged.add(Collections.unmodifiableList(mergedGroupValues));
                }
                return Collections.unmodifiableList(merged);
            }
        }


        Builder setCustomFieldValues(Map<String, CustomFieldValue> customFieldValues) {
            if (customFieldValues != null) {
                this.customFieldValues = customFieldValues;
            }
            return this;
        }

        Builder addCustomFieldValue(CustomFieldValue value) {
            if (customFieldValues == null) {
                customFieldValues = new HashMap<>();
            }
            customFieldValues.put(value.getKey(), value);
            return this;
        }

        String getIssueKey() {
            return issueKey;
        }

        public Builder setParallelTaskFieldValue(ParallelTaskGroupPosition position, int optionIndex) {
            initialiseParallelTaskGroupValues();
            if (parallelTaskGroupValues != null) {
                // This will be null if it is an override where the issue did not exist
                parallelTaskGroupValues[position.getGroupIndex()][position.getTaskIndex()] = optionIndex;
            }
            return this;
        }

        private Builder setParallelTaskGroupValues(Map<ParallelTaskGroupPosition,Integer> parallelTaskGroupValues) {
            parallelTaskGroupValues.entrySet().forEach(value -> setParallelTaskFieldValue(value.getKey(), value.getValue()));
            return this;
        }

        private void initialiseParallelTaskGroupValues() {
            if (parallelTaskGroupValues == null) {
                ProjectParallelTaskGroupsConfig parallelTaskGroupsConfig = project.getConfig().getParallelTaskGroupsConfig(issueTypeName);
                if (parallelTaskGroupsConfig != null) {
                    List<ProjectParallelTaskConfig> groups = parallelTaskGroupsConfig.getConfigGroups();
                    parallelTaskGroupValues = new Integer[groups.size()][];
                    for (int i = 0 ; i < groups.size() ; i++) {
                        parallelTaskGroupValues[i] = new Integer[groups.get(i).getConfigs().size()];
                    }
                }
            }
        }

        public void clearParallelTaskGroupValues() {
            clearParallelTaskGroupValues = true;
        }

        public Builder setEpicKey(String epicKey) {
            this.epicKey = epicKey;
            return this;
        }

        public Builder setParentIssueKey(String parentKey) {
            this.parentIssueKey = parentKey;
            return this;
        }
    }

    /**
     * <p>Loads up things like custom fields using the entities. This is done lazily for each issue, and is
     * fine when we are handling events to create or update entities.</p>
     * <p>This is not suitable for loading the full board, since the lazy loading results in an extra sql
     * query behind the scenes for every single custom field, for every single issue. When loading the full board
     * we instead do a bulk load to avoid this performance overhead.</p>
     * <p>For unit tests we currently use the lazy loading mechanism to load the custom fields, this is mainly
     * to avoid having to set up the mocks at present.</p>
     */
    static class LazyLoadStrategy implements IssueLoadStrategy {
        private final BoardProject.Accessor project;
        private boolean finished;
        private final Map<String, Issue.Builder> buildersByKey = new HashMap<>();

        private final Map<String, String> childToParentIssueKeys = new HashMap<>();
        private final Map<String, String> issuesToEpics = new HashMap<>();
        private final Map<String, Epic> newEpics = new HashMap<>();

        LazyLoadStrategy(BoardProject.Accessor project) {
            this.project = project;
        }



        @Override
        public void handle(com.atlassian.jira.issue.Issue issue, Builder builder) {
            buildersByKey.put(issue.getKey(), builder);

            builder.setCustomFieldValues(CustomFieldValue.loadCustomFieldValues(project, issue));
            CustomFieldValue.loadParallelTaskValues(project, issue, builder);

            com.atlassian.jira.issue.Issue parent = issue.getParentObject();
            if (parent != null) {
                childToParentIssueKeys.put(issue.getKey(), parent.getKey());

            }

            // TODO get from configuration
            final long epicLinkCustomField = project.getBoard().getConfig().getEpicLinkCustomFieldId();
            final long epicSummaryCustomField = project.getBoard().getConfig().getEpicSummaryCustomFieldId();

            if (project.projectConfig.isEnableEpics()) {
                CustomFieldManager customFieldManager = project.getJiraInjectables().getCustomFieldManager();
                CustomField epicLinkField = customFieldManager.getCustomFieldObject(epicLinkCustomField);
                if (epicLinkField != null) {
                    Object epicKeyObject = issue.getCustomFieldValue(epicLinkField);
                    if (epicKeyObject instanceof com.atlassian.jira.issue.Issue) {
                        com.atlassian.jira.issue.Issue epicIssue = (com.atlassian.jira.issue.Issue) epicKeyObject;
                        String epicKey = epicIssue.getKey();

                        Epic epic = project.getEpic(epicKey);
                        if (epic == null) {
                            epic = newEpics.get(epicKey);
                            if (epic == null) {
                                CustomField epicSummaryField = customFieldManager.getCustomFieldObject(epicSummaryCustomField);
                                if (epicSummaryField != null) {
                                    String epicSummary = (String)epicIssue.getCustomFieldValue(epicSummaryField);
                                    epic = new Epic(epicKey, epicSummary);
                                    newEpics.put(epicKey, epic);
                                } else {
                                    OverbaardLogger.LOGGER.warn("Could not load 'Epic Summary' field for Epic: " + epicKey);
                                }
                            }
                        }
                        if (epic != null) {
                            issuesToEpics.put(issue.getKey(), epicKey);
                        }
                    }
                }
            }

        }

        @Override
        public void finish() {
            if (finished) {
                return;
            }
            finished = true;

            processParentTasksAndEpics();

            if (newEpics.size() > 0) {
                final Map<String, Epic> allEpics = new HashMap<>(newEpics);
                project.collectAllEpics(allEpics);
                IndexedMap<String, Epic> orderedEpics =
                        getEpicsInRankOrder(
                                project.getJiraInjectables().getSearchService(),
                                project.getBoard().getBoardOwner(),
                                allEpics);
                project.setOrderedEpics(orderedEpics);

            }
        }

        private void processParentTasksAndEpics() {
            final boolean epics = project.getConfig().isEnableEpics();
            if (epics) {
                for (Map.Entry<String, String> issueToEpic : issuesToEpics.entrySet()) {
                    Issue.Builder builder = buildersByKey.get(issueToEpic.getKey());
                    if (builder == null) {
                        OverbaardLogger.LOGGER.warn("Could not find a builder for " + issueToEpic.getKey() + " to set epic (lazy)");
                    }

                    builder.setEpicKey(issueToEpic.getValue());
                }
            }

            for (Map.Entry<String, String> childToParent : childToParentIssueKeys.entrySet()) {
                final String childKey = childToParent.getKey();
                final String parentKey = childToParent.getValue();
                Issue.Builder builder = buildersByKey.get(childToParent.getKey());
                if (builder == null) {
                    OverbaardLogger.LOGGER.warn("Could not find a builder for " + childKey + " to set parent (lazy)");
                    continue;
                }

                builder.setParentIssueKey(parentKey);
                if (epics) {
                    String epic = issuesToEpics.get(parentKey);
                    if (epic == null) {
                        // When running in Jira we will not hit this path when loading the board initially. However,
                        // we will in the unit tests.
                        // Otherwise, when loading a single issue (or updating one) it is not guaranteed that the issue
                        // is in the issuesToEpics map, as that only contains issues that were updated in this change.
                        Epic parentEpic = project.getEpicForIssue(parentKey);
                        if (parentEpic != null) {
                            epic = parentEpic.getKey();
                        }

                    }

                    if (epic != null) {
                        builder.setEpicKey(epic);
                    }
                }
            }
        }
    }
 }
