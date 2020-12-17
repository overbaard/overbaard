package org.overbaard.jira.impl;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.config.IssueTypeManager;
import com.atlassian.jira.config.PriorityManager;
import com.atlassian.jira.issue.CustomFieldManager;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.security.GlobalPermissionManager;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.security.groups.GroupManager;

/**
 * Mock Injectables configured in the BoarcConfigurationManager that should also
 * be shared with the BoardManager
 *
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public interface ConfigurationManagerInjectables {
    PermissionManager getPermissionManager();

    ActiveObjects getActiveObjects();

    ProjectManager getProjectManager();

    CustomFieldManager getCustomFieldManager();

    IssueTypeManager getIssueTypeManager();

    PriorityManager getPriorityManager();

    GlobalPermissionManager getGlobalPermissionManager();

    GroupManager getGroupManager();
}
