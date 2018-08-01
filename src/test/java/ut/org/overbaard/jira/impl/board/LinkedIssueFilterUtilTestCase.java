package ut.org.overbaard.jira.impl.board;

import static org.overbaard.jira.impl.Constants.CODE;
import static org.overbaard.jira.impl.Constants.FILTER;
import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.LABELS;
import static org.overbaard.jira.impl.Constants.LINKED_ISSUES;
import static org.overbaard.jira.impl.Constants.LINKED_PROJECTS;
import static org.overbaard.jira.impl.Constants.LINK_NAMES;
import static org.overbaard.jira.impl.Constants.OVERRIDE;
import static org.overbaard.jira.impl.Constants.OVERRIDES;
import static org.overbaard.jira.impl.Constants.PRIORITIES;
import static org.overbaard.jira.impl.Constants.PROJECTS;
import static org.overbaard.jira.impl.Constants.STATES;
import static org.overbaard.jira.impl.Constants.TYPE_STATES;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jboss.dmr.ModelNode;
import org.junit.Assert;
import org.junit.Test;
import org.overbaard.jira.impl.BoardConfigurationManagerBuilder;
import org.overbaard.jira.impl.board.LinkedIssueFilterFactory;
import org.overbaard.jira.impl.board.LinkedIssueFilterUtil;
import org.overbaard.jira.impl.config.BoardProjectConfig;

import com.atlassian.jira.issue.Issue;

import ut.org.overbaard.jira.AbstractBoardTest;
import ut.org.overbaard.jira.mock.IssueRegistry.CreateIssueBuilder;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class LinkedIssueFilterUtilTestCase extends AbstractBoardTest {


    @Test
    public void testNonMatchingNoLinkedProjects() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testMatchingAcceptAllFilters() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN").setEmptyFilter();
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());
    }


    @Test
    public void testNonMatchingProjects() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setEmptyFilter();
        initializeMocks(builder.build());

        Issue issue = issueRegistry
                        .issueBuilder("NOMATCH", "bug", "high", "test", "test")
                        .buildAndRegister();
        BoardProjectConfig projectConfig = this.boardConfigurationManager.getBoardConfig("TST").getBoardProject("TDP");
        LinkedIssueFilterUtil util =
                LinkedIssueFilterFactory.create(projectConfig, "task", "cloned", issue, "NOMATCH");
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testMatchingIssueTypes() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setIssueTypes("bug", "task");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());
    }

    @Test
    public void testNonMatchingIssueTypes() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setIssueTypes("task");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testMatchingPriorities() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setPriorities("high", "low");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());
    }

    @Test
    public void testNonMatchingPriorities() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setPriorities("low");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());
    }


    @Test
    public void testMatchingLabels() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setLabels("L1", "L2");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .labels("L1", "L3")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());
    }

    @Test
    public void testNonMatchingLabels() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setLabels("L1", "L2");
        initializeMocks(builder.build());

        // No labels should not match
        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());

        // Wrong labels should not match
        issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testMatchingLinkNames() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setLinkNames("cloned", "blocks");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());

    }

    @Test
    public void testNonMatchingLinkNames() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setLinkNames("blocks");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testMatchingAllFilters() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setIssueTypes("bug", "task")
                .setPriorities("high", "low")
                .setLabels("L1", "L2")
                .setLinkNames("cloned");
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .labels("L1", "L2")
                .buildAndRegister();
        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertTrue(util.includeIssue());
    }

    @Test
    public void testNonMatchingAllFilters() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setIssueTypes("bug", "task")
                .setPriorities("high", "low")
                .setLabels("L1", "L2")
                .setLinkNames("cloned");
        initializeMocks(builder.build());


        // Wrong issue type
        Issue issue = createIssue("feature", "high", "test")
                .labels("L1", "L2")
                .buildAndRegister();

        LinkedIssueFilterUtil util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());

        // Wrong priority
        issue = createIssue("bug", "highest", "test")
                .labels("L1", "L2")
                .buildAndRegister();

        util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());

        // Wrong labels
        issue = createIssue("bug", "high", "test")
                .labels("L3")
                .buildAndRegister();

        util = createUtil("task", "cloned", issue);
        Assert.assertFalse(util.includeIssue());


        // Wrong link name
        issue = createIssue("bug", "high", "test")
                .labels("L1", "L2")
                .buildAndRegister();

        util = createUtil("task", "test", issue);
        Assert.assertFalse(util.includeIssue());
    }

    @Test
    public void testOverrideIssueTypes() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setIssueTypes("bug");
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN")
                .setIssueTypes("task");

        initializeMocks(builder.build());


        Issue bug = createIssue("bug", "high", "test")
                .buildAndRegister();
        // Owning issue type 'task' should match 'bug' as no overrides should be used
        Assert.assertTrue(createUtil("task", "cloned", bug).includeIssue());
        // Owning issue type 'feature' should not match 'bug' as overrides should be used
        Assert.assertFalse(createUtil("feature", "cloned", bug).includeIssue());


        Issue task = createIssue("task", "high", "test")
                .buildAndRegister();
        // Owning issue type 'feature' should match 'task' as overrides should be used
        Assert.assertTrue(createUtil("feature", "cloned", task).includeIssue());
        // Owning issue type 'task' should not match 'task' as no overrides should be used
        Assert.assertFalse(createUtil("task", "cloned", task).includeIssue());
    }


    @Test
    public void testOverridePriorities() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setPriorities("high");
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN")
                .setPriorities("low");

        initializeMocks(builder.build());


        Issue high = createIssue("bug", "high", "test")
                .buildAndRegister();
        // Owning issue type 'task' should match 'high' as no overrides should be used
        Assert.assertTrue(createUtil("task", "cloned", high).includeIssue());
        // Owning issue type 'feature' should not match 'high' as overrides should be used
        Assert.assertFalse(createUtil("feature", "cloned", high).includeIssue());


        Issue low = createIssue("task", "low", "test")
                .buildAndRegister();
        // Owning issue type 'feature' should match 'low' as overrides should be used
        Assert.assertTrue(createUtil("feature", "cloned", low).includeIssue());
        // Owning issue type 'task' should not match 'low' as no overrides should be used
        Assert.assertFalse(createUtil("task", "cloned", low).includeIssue());
    }

    @Test
    public void testOverrideLinkNames() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setLinkNames("cloned to", "cloned from");
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN")
                .setLinkNames("blocks", "blocked by");

        initializeMocks(builder.build());


        // All the changes here are in the  links, so just use the same issue for both sets of checks
        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();

        // Owning issue type 'task' should match 'cloned from' as no overrides should be used
        Assert.assertTrue(createUtil("task", "cloned from", issue).includeIssue());
        // Owning issue type 'feature' should not match 'cloned from' as overrides should be used
        Assert.assertFalse(createUtil("feature", "cloned from", issue).includeIssue());


        // Owning issue type 'feature' should match 'blocks' as overrides should be used
        Assert.assertTrue(createUtil("feature", "blocks", issue).includeIssue());
        // Owning issue type 'task' should not match 'blocks' as no overrides should be used
        Assert.assertFalse(createUtil("task", "blocks", issue).includeIssue());
    }

    @Test
    public void testOverrideProjects() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN1").setStates("test");
        builder.addLinkedProject("LN2").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN1")
                .setEmptyFilter();
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN2")
                .setEmptyFilter();
        initializeMocks(builder.build());

        BoardProjectConfig projectConfig = this.boardConfigurationManager.getBoardConfig("TST").getBoardProject("TDP");

        Issue ln1 = issueRegistry
                .issueBuilder("LN1", "bug", "high", "test", "test")
                .buildAndRegister();
        // Owning issue type 'task' should match 'LN1' as no overrides should be used
        LinkedIssueFilterUtil util = LinkedIssueFilterFactory.create(projectConfig, "x", "x", ln1, "LN2");

        Assert.assertTrue(createUtil("task", "cloned", ln1).includeIssue());
        // Owning issue type 'feature' should not match 'LN1' as overrides should be used
        Assert.assertFalse(createUtil("feature", "cloned from", ln1).includeIssue());

        Issue ln2 = issueRegistry
                .issueBuilder("LN2", "bug", "high", "test", "test")
                .buildAndRegister();
        // Owning issue type 'feature' should match 'LN2' as no overrides should be used
        Assert.assertTrue(createUtil("feature", "cloned", ln2).includeIssue());
        // Owning issue type 'task' should not match 'LN2' as overrides should be used
        Assert.assertFalse(createUtil("task", "cloned from", ln2).includeIssue());
    }

    @Test
    public void testOverridesOnly() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN")
                .setEmptyFilter();
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        // Owning issue type 'task' should not match 'LN' as there are no overrides
        Assert.assertFalse(createUtil("task", "cloned", issue).includeIssue());
        // Owning issue type 'feature' should match 'LN' as there are overrides
        Assert.assertTrue(createUtil("feature", "cloned", issue).includeIssue());
    }

    @Test
    public void disableOverrides() throws Exception {
        BoardConfigBuilder builder = new BoardConfigBuilder();
        builder.addLinkedProject("LN").setStates("test");
        BoardProjectConfigBuilder projectBuilder = builder.getProjectBuilder("TDP");
        projectBuilder.linkedIssueFilterBuilder("LN")
                .setEmptyFilter();
        projectBuilder.overrideBuilder("feature")
                .linkedIssueFilterBuilder("LN")
                .setDisableFilter();
        initializeMocks(builder.build());

        Issue issue = createIssue("bug", "high", "test")
                .buildAndRegister();
        // Owning issue type 'task' should match 'LN' as is does not use the disabled overrides
        Assert.assertTrue(createUtil("task", "cloned", issue).includeIssue());
        // Owning issue type 'feature' should not match 'LN' as there are disabled overrides
        Assert.assertFalse(createUtil("feature", "cloned", issue).includeIssue());
    }


    CreateIssueBuilder createIssue(String type, String priority, String state) {
        return issueRegistry
                .issueBuilder("LN", type, priority, "test", state);
    }

    LinkedIssueFilterUtil createUtil(String owningIssueType, String linkName, Issue issue) {
        String issueKey = issue.getKey();
        int index = issueKey.indexOf("-");
        String projectKey = issueKey.substring(0, index);

        BoardProjectConfig projectConfig = this.boardConfigurationManager.getBoardConfig("TST").getBoardProject("TDP");
        return LinkedIssueFilterFactory.create(projectConfig, owningIssueType, linkName, issue, projectKey);
    }


    void initializeMocks(ModelNode config) throws Exception {
        super.initializeMocks(config, null);
    }

    static class BoardConfigBuilder {
        final ModelNode boardConfig;
        final List<LinkedProjectBuilder> linkedProjectBuilders = new ArrayList<>();
        final Set<BoardProjectConfigBuilder> boardProjectConfigBuilders = new LinkedHashSet<>();
        final List<Integer> boardProjectBuilderIndices = new ArrayList<>();

        public BoardConfigBuilder() throws IOException {
            this.boardConfig = BoardConfigurationManagerBuilder.loadConfig("config/board-tdp.json");
        }

        BoardProjectConfigBuilder getProjectBuilder(String projectName) {
            int i = 0;
            for (ModelNode project : boardConfig.get(PROJECTS).asList()) {
                if (project.get(CODE).asString().equals(projectName)) {
                    BoardProjectConfigBuilder builder = new BoardProjectConfigBuilder();
                    boardProjectConfigBuilders.add(builder);
                    boardProjectBuilderIndices.add(i);
                    return builder;
                }
                i++;
            }
            throw new IllegalStateException("No project called " + projectName);
        }

        LinkedProjectBuilder addLinkedProject(String name) {
            LinkedProjectBuilder builder = new LinkedProjectBuilder(name);
            linkedProjectBuilders.add(builder);
            return builder;
        }

        ModelNode build() {
            for (LinkedProjectBuilder builder : linkedProjectBuilders) {
                boardConfig.get(LINKED_PROJECTS, builder.projectName).set(builder.build());
            }
            int i = 0;
            for (BoardProjectConfigBuilder builder : boardProjectConfigBuilders) {
                ModelNode project = boardConfig.get(PROJECTS).get(boardProjectBuilderIndices.get(i));
                boardConfig.get(PROJECTS).get(boardProjectBuilderIndices.get(i)).set(builder.build(project));
                i++;
            }

            return boardConfig;
        }
    }

    static class LinkedProjectBuilder {
        private final String projectName;
        private String[] states;
        private Map<String, String[]> overrides;

        public LinkedProjectBuilder(String projectName) {
            this.projectName = projectName;
        }

        void setStates(String... states) {
            this.states = states;
        }

        void addStateOverride(String issueType, String... states) {
            if (overrides == null) {
                overrides = new HashMap<>();
            }
        }

        ModelNode build() {
            ModelNode linkedProject = new ModelNode();
            if (states != null) {
                for (String state : states) {
                    linkedProject.get(STATES).add(state);
                }
            }
            if (overrides != null) {
                for (Map.Entry<String, String[]> entry : overrides.entrySet()) {
                    for (String state : states) {
                        linkedProject.get(TYPE_STATES, entry.getKey()).add();
                    }
                }
            }
            return linkedProject;
        }
    }

    static class BoardProjectConfigBuilder {
        private final List<LinkedIssueFilterBuilder> linkedIssueBuilders = new ArrayList<>();
        private final List<IssueTypeOverrideBuilder> overrideBuilders = new ArrayList<>();

        public BoardProjectConfigBuilder() {
        }

        LinkedIssueFilterBuilder linkedIssueFilterBuilder(String... projects) {
            LinkedIssueFilterBuilder builder = new LinkedIssueFilterBuilder(projects);
            linkedIssueBuilders.add(builder);
            return builder;
        }

        IssueTypeOverrideBuilder overrideBuilder(String... issueTypes) {
            IssueTypeOverrideBuilder builder = new IssueTypeOverrideBuilder(issueTypes);
            overrideBuilders.add(builder);
            return builder;

        }

        public ModelNode build(ModelNode project) {
            for (LinkedIssueFilterBuilder builder : linkedIssueBuilders) {
                project.get(LINKED_ISSUES).add(builder.build());
            }
            for (IssueTypeOverrideBuilder builder : overrideBuilders) {
                project.get(OVERRIDES, LINKED_ISSUES).add(builder.build());
            }
            return project;
        }
    }

    static class IssueTypeOverrideBuilder {
        private final String[] issueTypes;
        private final List<LinkedIssueFilterBuilder> linkedIssueBuilders = new ArrayList<>();

        public IssueTypeOverrideBuilder(String[] issueTypes) {
            this.issueTypes = issueTypes;
        }

        LinkedIssueFilterBuilder linkedIssueFilterBuilder(String... projects) {
            LinkedIssueFilterBuilder builder = new LinkedIssueFilterBuilder(projects);
            linkedIssueBuilders.add(builder);
            return builder;
        }

        ModelNode build() {
            ModelNode override = new ModelNode();
            for (String type : issueTypes) {
                override.get(ISSUE_TYPES).add(type);
            }
            for (LinkedIssueFilterBuilder builder : linkedIssueBuilders) {
                override.get(OVERRIDE).add(builder.build());
            }
            return override;
        }
    }

    static class LinkedIssueFilterBuilder {

        private final String[] projects;
        private boolean emptyFilter;
        private boolean disableFilter;
        private String[] issueTypes;
        private String[] priorities;
        private String[] labels;
        private String[] linkNames;


        public LinkedIssueFilterBuilder(String[] projects) {
            this.projects = projects;
        }

        public LinkedIssueFilterBuilder setEmptyFilter() {
            emptyFilter = true;
            return this;
        }

        public LinkedIssueFilterBuilder setDisableFilter() {
            disableFilter = true;
            return this;
        }

        public LinkedIssueFilterBuilder setIssueTypes(String... issueTypes) {
            this.issueTypes = issueTypes;
            return this;
        }

        public LinkedIssueFilterBuilder setPriorities(String... priorities) {
            this.priorities = priorities;
            return this;
        }

        public LinkedIssueFilterBuilder setLabels(String... labels) {
            this.labels = labels;
            return this;
        }

        public LinkedIssueFilterBuilder setLinkNames(String... linkNames) {
            this.linkNames = linkNames;
            return this;
        }


        ModelNode build() {
            ModelNode linkedIssueConfig = new ModelNode();
            for (String project : projects) {
                linkedIssueConfig.get(PROJECTS).add(project);
            }
            if (disableFilter) {
                if (emptyFilter || issueTypes != null || priorities != null || labels != null || linkNames != null) {
                    throw new IllegalStateException("Bad config");
                }
                linkedIssueConfig.get(FILTER).set(new ModelNode());
            } else {
                if (emptyFilter) {
                    linkedIssueConfig.get(FILTER).setEmptyObject();
                }
                setListValue(linkedIssueConfig, ISSUE_TYPES, issueTypes);
                setListValue(linkedIssueConfig, PRIORITIES, priorities);
                setListValue(linkedIssueConfig, LABELS, labels);
                setListValue(linkedIssueConfig, LINK_NAMES, linkNames);
            }
            return linkedIssueConfig;
        }

        private void setListValue(ModelNode linkedIssueConfig, String name, String... values) {
            if (values == null) {
                return;
            }
            for (String value : values) {
                linkedIssueConfig.get(FILTER, name).add(value);
            }
        }
    }

}
