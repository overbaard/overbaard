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
package org.overbaard.jira.impl;

import org.overbaard.jira.api.BoardConfigurationManager;
import org.overbaard.jira.api.BoardManager;
import org.overbaard.jira.api.NextRankedIssueUtil;
import org.overbaard.jira.api.ProjectCustomFieldOptionsLoader;
import org.overbaard.jira.impl.board.ProjectParallelTaskOptionsLoaderBuilder;

import com.atlassian.jira.avatar.AvatarService;
import com.atlassian.jira.bc.issue.IssueService;
import com.atlassian.jira.bc.issue.search.SearchService;
import com.atlassian.jira.bc.user.UserService;
import com.atlassian.jira.issue.customfields.manager.OptionsManager;
import com.atlassian.jira.issue.link.IssueLinkManager;
import com.atlassian.jira.issue.search.SearchContextFactory;
import com.atlassian.jira.project.version.VersionManager;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.user.util.UserManager;
import com.atlassian.sal.api.ApplicationProperties;

import ut.org.overbaard.jira.mock.AvatarServiceBuilder;

/**
 * @author Kabir Khan
 */
public class BoardManagerBuilder {

    private final BoardConfigurationManager boardConfigurationManager;
    private final ConfigurationManagerInjectables configurationManagerInjectables;
    private SearchService searchService;
    private AvatarService avatarService = AvatarServiceBuilder.getUserNameUrlMock();
    private IssueLinkManager issueLinkManager;
    private UserManager userManager;
    private PermissionManager permissionManager;
    private NextRankedIssueUtil nextRankedIssueUtil;
    private ProjectCustomFieldOptionsLoader projectCustomFieldOptionsLoader = new ProjectParallelTaskOptionsLoaderBuilder().build();

    public BoardManagerBuilder(BoardConfigurationManager boardConfigurationManager, ConfigurationManagerInjectables configurationManagerInjectables) {
        this.boardConfigurationManager = boardConfigurationManager;
        this.configurationManagerInjectables = configurationManagerInjectables;
        this.permissionManager = configurationManagerInjectables.getPermissionManager();
    }

    public BoardManagerBuilder setSearchService(SearchService searchService) {
        this.searchService = searchService;
        return this;
    }

    public BoardManagerBuilder setAvatarService(AvatarService avatarService) {
        this.avatarService = avatarService;
        return this;
    }

    public BoardManagerBuilder setIssueLinkManager(IssueLinkManager issueLinkManager) {
        this.issueLinkManager = issueLinkManager;
        return this;
    }

    public BoardManagerBuilder setUserManager(UserManager userManager) {
        this.userManager = userManager;
        return this;
    }

    public BoardManagerBuilder setPermissionManager(PermissionManager permissionManager) {
        this.permissionManager = permissionManager;
        return this;
    }

    public BoardManagerBuilder setNextRankedIssueUtil(NextRankedIssueUtil nextRankedIssueUtil) {
        this.nextRankedIssueUtil = nextRankedIssueUtil;
        return this;
    }

    public BoardManagerBuilder setProjectCustomFieldOptionsLoader(ProjectCustomFieldOptionsLoader projectCustomFieldOptionsLoader) {
        this.projectCustomFieldOptionsLoader = projectCustomFieldOptionsLoader;
        return this;
    }

    public BoardManager build() {
        //These are not needed for this code path at the moment
        final ApplicationProperties applicationProperties = null;
        final IssueService issueService = null;
        final OptionsManager optionsManager = null;
        final SearchContextFactory searchContextFactory = null;
        final UserService userService = null;
        final VersionManager versionManager = null;

        JiraInjectables jiraInjectables = new JiraInjectables(
                configurationManagerInjectables.getActiveObjects(),
                applicationProperties,
                avatarService,
                configurationManagerInjectables.getCustomFieldManager(),
                configurationManagerInjectables.getGlobalPermissionManager(),
                issueService,
                issueLinkManager,
                configurationManagerInjectables.getIssueTypeManager(),
                optionsManager,
                permissionManager,
                configurationManagerInjectables.getProjectManager(),
                configurationManagerInjectables.getPriorityManager(),
                searchContextFactory,
                searchService,
                userService,
                versionManager);

        return new BoardManagerImpl(jiraInjectables, boardConfigurationManager, projectCustomFieldOptionsLoader);
    }
}
