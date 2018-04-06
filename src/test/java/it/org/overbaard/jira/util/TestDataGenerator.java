package it.org.overbaard.jira.util;

import static org.overbaard.jira.impl.Constants.ASSIGNEE;
import static org.overbaard.jira.impl.Constants.ASSIGNEES;
import static org.overbaard.jira.impl.Constants.AVATAR;
import static org.overbaard.jira.impl.Constants.BACKLOG;
import static org.overbaard.jira.impl.Constants.CODE;
import static org.overbaard.jira.impl.Constants.COLOUR;
import static org.overbaard.jira.impl.Constants.COMPONENTS;
import static org.overbaard.jira.impl.Constants.CURRENT_USER;
import static org.overbaard.jira.impl.Constants.DONE;
import static org.overbaard.jira.impl.Constants.EMAIL;
import static org.overbaard.jira.impl.Constants.FIX_VERSIONS;
import static org.overbaard.jira.impl.Constants.HEADERS;
import static org.overbaard.jira.impl.Constants.ISSUES;
import static org.overbaard.jira.impl.Constants.ISSUE_TYPES;
import static org.overbaard.jira.impl.Constants.KEY;
import static org.overbaard.jira.impl.Constants.LABELS;
import static org.overbaard.jira.impl.Constants.MAIN;
import static org.overbaard.jira.impl.Constants.NAME;
import static org.overbaard.jira.impl.Constants.OWNER;
import static org.overbaard.jira.impl.Constants.PRIORITIES;
import static org.overbaard.jira.impl.Constants.PRIORITY;
import static org.overbaard.jira.impl.Constants.PROJECTS;
import static org.overbaard.jira.impl.Constants.RANK;
import static org.overbaard.jira.impl.Constants.RANKED;
import static org.overbaard.jira.impl.Constants.RANK_CUSTOM_FIELD_ID;
import static org.overbaard.jira.impl.Constants.STATE;
import static org.overbaard.jira.impl.Constants.STATES;
import static org.overbaard.jira.impl.Constants.STATE_LINKS;
import static org.overbaard.jira.impl.Constants.SUMMARY;
import static org.overbaard.jira.impl.Constants.TYPE;
import static org.overbaard.jira.impl.Constants.VIEW;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.impl.Constants;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class TestDataGenerator {

    private static final String MAIN_PROJECT_NAME = "MAIN";
    private static final int NUMBER_STATES = 10;
    private static final int NUMBER_ASSIGNEES = 50;
    private static final int NUMBER_COMPONENTS = 50;
    private static final int NUMBER_LABELS = 40;
    private static final int NUMBER_FIX_VERSIONS = 10;
    private static final int NUMBER_ISSUE_TYPES = 5;
    private static final int NUMBER_PRIORITIES = 6;
    //TODO
    //private static final int NUMBER_CUSTOM_FIELDS = 0;
    //private static final int NUMBER_CUSTOM_FIELD_ENTRIES = 0;

    //TODO
    //private static final int NUMBER_PARALLEL_TASKS = 0;
    //private static final int NUMBER_LINKED_PROJECTS = 0;
    //private static final int NUMBER_LINKED_PROJECT_STATES = 0;
    //private static final int NUMBER_LINKED_PROJECT_ENTRIES = 0;

    private static final int NUMBER_ISSUES = 13;

    TestDataGenerator() {
    }

    private void generate() throws IOException {
        final ModelNode output = generateOutput();
        System.out.println(output.toJSONString(false));
        final Path path = Paths.get("webapp", "src", "rest", "overbaard", "1.0", "issues", "testdata.json").toAbsolutePath();
        final File file;
        if (Files.exists(path)) {
            Files.delete(path);
            file = path.toFile();
        } else {
            file = Files.createFile(path).toFile();
        }

        try (PrintWriter writer = new PrintWriter(new FileOutputStream(file))){
            output.writeJSONString(writer, false);
        }

        System.out.println(path);
    }

    private ModelNode generateOutput() {
        final ModelNode modelNode = new ModelNode();
        modelNode.get(VIEW).set(1);
        modelNode.get(CURRENT_USER).set("kabir");
        modelNode.get(RANK_CUSTOM_FIELD_ID).set(11111L);

        ModelNode states = modelNode.get(STATES).setEmptyList();
        for (int i = 0 ; i < NUMBER_STATES ; i++) {
            ModelNode state = new ModelNode();
            state.get(NAME).set("State Number " + (i + 1));
            states.add(state);
        }

        modelNode.get(BACKLOG).set(0);
        modelNode.get(DONE).set(0);
        modelNode.get(HEADERS).setEmptyList();

        ModelNode assignees = modelNode.get(ASSIGNEES).setEmptyList();
        for (int i = 0 ; i < NUMBER_ASSIGNEES ; i++) {
            ModelNode node = new ModelNode();
            node.get(KEY).set("ass " + (i + 1));
            node.get(EMAIL).set("ass" + (i + 1) + "@example.com");
            node.get(AVATAR).set("https://static.jboss.org/developer/gravatar/00aa85cb5ea8fd5882bab9765f40655e?d=mm&s=32");
            node.get(NAME).set("Assignee Number " + (i + 1));
            assignees.add(node);
        }

        ModelNode components = modelNode.get(COMPONENTS).setEmptyList();
        for (int i = 0 ; i < NUMBER_COMPONENTS ; i++) {
            components.add("Component " + (i + 1));
        }

        ModelNode labels = modelNode.get(LABELS).setEmptyList();
        for (int i = 0 ; i < NUMBER_LABELS ; i++) {
            labels.add("Label " + (i + 1));
        }

        ModelNode fixVersions = modelNode.get(FIX_VERSIONS).setEmptyList();
        for (int i = 0 ; i < NUMBER_FIX_VERSIONS ; i++) {
            fixVersions.add((i + 1) + ".0.0.GA");
        }

        ModelNode priorities = modelNode.get(PRIORITIES).setEmptyList();
        for (int i = 0 ; i < NUMBER_PRIORITIES ; i++) {
            ModelNode node = new ModelNode();
            node.get(NAME).set("Priority " + (i + 1));
            node.get(COLOUR).set("green");
            priorities.add(node);
        }

        ModelNode issueTypes = modelNode.get(ISSUE_TYPES).setEmptyList();
        for (int i = 0 ; i < NUMBER_ISSUE_TYPES ; i++) {
            ModelNode node = new ModelNode();
            node.get(NAME).set("Issue Type " + (i + 1));
            node.get(COLOUR).set("grey");
            issueTypes.add(node);
        }

        ModelNode projects = modelNode.get(PROJECTS).setEmptyObject();
        projects.get(MAIN).add(generateProject());

        modelNode.get(ISSUES).set(generateIssues());
        return modelNode;
    }

    private ModelNode generateProject() {
        ModelNode project = new ModelNode();
        project.get(CODE).set(MAIN_PROJECT_NAME);
        project.get(COLOUR).set("#4667CA");
        project.get(RANK).set(true);
        ModelNode stateLinks = project.get(STATE_LINKS).setEmptyObject();
        for (int i = 0 ; i < NUMBER_STATES ; i++) {
            String name = "State Number " + (i + 1);
            stateLinks.get(name).set(name);
        }
        ModelNode ranked = project.get(RANKED).setEmptyList();
        for (int i = 0 ; i < NUMBER_ISSUES ; i++) {
            ranked.add(MAIN_PROJECT_NAME + "-" + (i + 1));
        }
        return project;
    }

    private ModelNode generateIssues() {
        ModelNode issues = new ModelNode().setEmptyObject();
        for (int i = 0 ; i < NUMBER_ISSUES ; i++) {
            String key = MAIN_PROJECT_NAME + "-" + (i + 1);
            ModelNode issue = new ModelNode();
            issue.get(KEY).set(key);
            issue.get(STATE).set(i % NUMBER_STATES);
            issue.get(SUMMARY).set(createSummary(i));
            issue.get(COMPONENTS).add(i % NUMBER_COMPONENTS);
            issue.get(LABELS).add(i % NUMBER_LABELS);
            issue.get(FIX_VERSIONS).add(i % NUMBER_FIX_VERSIONS);
            issue.get(ASSIGNEE).set(i % NUMBER_ASSIGNEES);
            issue.get(PRIORITY).set(i % NUMBER_PRIORITIES);
            issue.get(TYPE).set(i % NUMBER_ISSUE_TYPES);

            issues.get(key).set(issue);
        }
        return issues;
    }

    private String createSummary(int issue) {
        StringBuilder sb = new StringBuilder("Someone needs to implement and test Issue Number " + issue);
        int words = (int)(Math.random() * 20);
        for (int i = 0 ; i < words ; i++) {
            sb.append(" word" + i);
        }
        return sb.toString();
    }

    public static void main(String[] args) throws IOException {
        TestDataGenerator generator = new TestDataGenerator();
        generator.generate();
    }
}
