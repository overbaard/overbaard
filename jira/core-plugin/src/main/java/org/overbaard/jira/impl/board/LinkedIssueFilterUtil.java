package org.overbaard.jira.impl.board;

import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.LinkedIssueFilterConfig;

import com.atlassian.jira.issue.Issue;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class LinkedIssueFilterUtil {
    private final BoardProjectConfig projectConfig;
    private final String owningIssueType;
    private final String linkName;
    private final Issue linkedIssue;
    private final String linkedProjectKey;

    LinkedIssueFilterUtil(BoardProjectConfig projectConfig, String owningIssueType, String linkName, Issue linkedIssue, String linkedProjectKey) {
        this.projectConfig = projectConfig;
        this.owningIssueType = owningIssueType;
        this.linkName = linkName;
        this.linkedIssue = linkedIssue;
        this.linkedProjectKey = linkedProjectKey;
    }

    public boolean includeIssue() {
        LinkedIssueFilterConfig filterConfig =
                projectConfig.getLinkedIssueFilterConfig(owningIssueType).get(linkedProjectKey);
        if (filterConfig == null) {
            // There is no linked issue filter config for the project/issue type
            return false;
        }

        if (filterConfig.isEmptyOverride()) {
            return false;
        }

        if (filterConfig.getIssueTypes().size() > 0) {
            if (!filterConfig.getIssueTypes().contains(linkedIssue.getIssueType().getName())) {
                return false;
            }
        }
        if (filterConfig.getPriorities().size() > 0) {
            if (!filterConfig.getPriorities().contains(linkedIssue.getPriority().getName())) {
                return false;
            }
        }
        if (filterConfig.getLinkNames().size() > 0) {
            if (!filterConfig.getLinkNames().contains(linkName)) {
                return false;
            }
        }
        if (filterConfig.getLabels().size() > 0) {
            boolean matchesOneLabel = false;
            if (linkedIssue.getLabels() != null) {
                for (com.atlassian.jira.issue.label.Label label : linkedIssue.getLabels()) {
                    if (filterConfig.getLabels().contains(label.getLabel())) {
                        matchesOneLabel = true;
                        break;
                    }
                }
            }
            if (!matchesOneLabel) {
                return false;
            }
        }
        return true;
    }
}
