package org.overbaard.jira.impl.board;

import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.LinkedIssueFilterConfig;

import com.atlassian.jira.issue.Issue;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class LinkedIssueFilterFactory {
    private LinkedIssueFilterFactory() {
    }

    public static LinkedIssueFilterUtil create(BoardProjectConfig projectConfig, String owningIssueType, String linkName, Issue linkedIssue, String linkedProjectKey) {
        return new LinkedIssueFilterUtil(projectConfig, owningIssueType, linkName, linkedIssue, linkedProjectKey);
    }
}
