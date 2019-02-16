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
package org.overbaard.jira.api;

import java.util.Set;

import org.overbaard.jira.impl.OverbaardIssueEvent;
import org.overbaard.jira.impl.config.CustomFieldConfig;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;

import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.user.ApplicationUser;

/**
 * @author Kabir Khan
 */
public interface BoardManager {
    /**
     * Gets the json for a board populated with issues
     *
     * @param user the logged in user
     * @param backlog if {@true} we will include issues belonging to the backlog states
     * @param code the code of the board
     * @return the board in json format
     * @throws SearchException
     */
    String getBoardJson(ApplicationUser user, boolean backlog, String code) throws SearchException;

    /**
     * Get the name of a board from its code
     * @param user the user
     * @param boardCode the board code
     * @return json containing the name of the board
     */
    String getBoardName(ApplicationUser user, String boardCode) throws SearchException;

    /**
     * Deletes a board
     * @param user the logged in user
     * @param code the id of the board to delete
     */
    void deleteBoard(ApplicationUser user, String code);

    /**
     * Checks whether there are any boards which has the passed in {@code projectCode} as one of the board projects.
     *
     * @param projectCode the project code
     * @return {@code true} if there are boards
     */
    boolean hasBoardsForProjectCode(String projectCode);

    /**
     * Handles an event from the underlying Jira instance to create, delete, update issues on the affected boards
     *
     * @param event the event
     */
    void handleEvent(OverbaardIssueEvent event, NextRankedIssueUtil nextRankedIssueUtil);

    /**
     * Gets the changes for a board. The client passes in their view id, and the delta is passed back to the client in
     * json format so they can apply it to their own model.
     *
     * @param user the logged in user
     * @param backlog if {@true} we will include changes to issues belonging to the backlog states
     * @param code the board code
     * @param viewId the view id of the client.
     * @return the json containing the changes
     */
    String getChangesJson(ApplicationUser user, boolean backlog, String code, int viewId) throws SearchException;

    /**
     * If one or more boards for the project is set up to use the custom field, we return the custom field configs.
     * If none of the projects are configured to use the custom field, we return an empty set.
     *
     * @param projectCode the project code
     * @param jiraCustomFieldName the custom field name. Note that this is the name of the field in Jira, not in the Overbård config
     * @return the custom field configs on boards involving the project, or an empty set if no boards are set up to use a custom field for {@code jiraCustomFieldName}
     */
    Set<CustomFieldConfig> getCustomFieldsForUpdateEvent(String projectCode, String jiraCustomFieldName);

    /**
     * Gets all the possible custom field configurations for a created issue
     *
     * @param projectCode the project code
     * @return the custom field configs on boards involving the issue.
     */
    Set<CustomFieldConfig> getCustomFieldsForCreateEvent(String projectCode);

    /**
     * If one or more boards for the project is set up to use the parallel task custom field, we return the custom field configs.
     * If none of the projects are configured to use the custom field, we return an empty set.
     *
     * @param projectCode the project code
     * @param jiraCustomFieldName the custom field name. Note that this is the name of the field in Jira, not in the Overbård config
     * @return the custom field configs on boards involving the project, or an empty set if no boards are set up to use a custom field for {@code jiraCustomFieldName}
     */
    Set<ParallelTaskCustomFieldConfig> getParallelTaskFieldsForUpdateEvent(String projectCode, String issueType, String jiraCustomFieldName);

    /**
     * Gets all the possible parallel task custom field configurations for a created issue
     *
     * @param projectCode the project code
     * @return the custom field configs on boards involving the issue.
     */
    Set<ParallelTaskCustomFieldConfig> getParallelTaskFieldsForCreateEvent(String projectCode, String issueType);

    void updateParallelTaskForIssue(ApplicationUser user, String boardCode, String issueKey, int groupIndex, int taskIndex, int optionIndex) throws SearchException;
}
