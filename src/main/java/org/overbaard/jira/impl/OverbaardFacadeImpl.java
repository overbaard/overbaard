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

import java.io.InputStream;
import java.util.jar.Manifest;

import javax.inject.Inject;
import javax.inject.Named;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardLogger;
import org.overbaard.jira.api.BoardConfigurationManager;
import org.overbaard.jira.api.BoardManager;
import org.overbaard.jira.api.JiraFacade;
import org.overbaard.jira.api.UserAccessManager;
import org.overbaard.jira.impl.config.BoardConfig;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;

import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.user.ApplicationUser;

@Named ("overbaardJiraFacade")
public class OverbaardFacadeImpl implements JiraFacade, InitializingBean, DisposableBean {
    private final BoardConfigurationManager boardConfigurationManager;

    private final BoardManager boardManager;

    private final UserAccessManager userAccessManager;

    private static final String overbaardVersion;

    static {
        String version;
        try (InputStream stream = OverbaardFacadeImpl.class.getClassLoader().getResourceAsStream("META-INF/MANIFEST.MF")) {
            Manifest manifest = null;
            if (stream != null) {
                manifest = new Manifest(stream);
            }
            version = manifest.getMainAttributes().getValue("Bundle-Version");
        } catch (Exception e) {
            // ignored
            version = "Error";
        }
        overbaardVersion = version;
    }

    @Inject
    public OverbaardFacadeImpl(final BoardConfigurationManager boardConfigurationManager,
                               final BoardManager boardManager,
                               final UserAccessManager userAccessManager) {
        this.boardConfigurationManager = boardConfigurationManager;
        this.boardManager = boardManager;
        this.userAccessManager = userAccessManager;
    }

    @Override
    public String getBoardConfigurations(ApplicationUser user) {
        return boardConfigurationManager.getBoardsJson(user, true);
    }

    @Override
    public String getBoardJsonForConfig(ApplicationUser user, int boardId) {
        return boardConfigurationManager.getBoardJsonConfig(user, boardId);
    }

    @Override
    public void saveBoardConfiguration(ApplicationUser user, int id, String jiraUrl, ModelNode config) {
        BoardConfig boardConfig = boardConfigurationManager.saveBoard(user, id, config);
        if (id >= 0) {
            //We are modifying a board's configuration. Delete the board config and board data to force a refresh.
            boardManager.deleteBoard(user, boardConfig.getCode());
        }
    }

    @Override
    public void deleteBoardConfiguration(ApplicationUser user, int id) {
        final String code = boardConfigurationManager.deleteBoard(user, id);
        boardManager.deleteBoard(user, code);
    }

    @Override
    public String getBoardJson(ApplicationUser user, boolean backlog, String code) throws SearchException {
        try {
            return boardManager.getBoardJson(user, backlog, code);
        } catch (Exception e) {
            //Last parameter is the exception (it does not match a {} entry)
            OverbaardLogger.LOGGER.debug("BoardManagerImpl.handleEvent - Error loading board {}", code, e);
            if (e instanceof SearchException || e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException(e);
        }
    }

    @Override
    public String getBoardName(ApplicationUser user, String code) throws SearchException {
        try {
            return boardManager.getBoardName(user, code);
        } catch (Exception e) {
            //Last parameter is the exception (it does not match a {} entry)
            OverbaardLogger.LOGGER.debug("BoardManagerImpl.handleEvent - Error loading board {}", code, e);
            if (e instanceof SearchException || e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException(e);
        }
    }

    @Override
    public String getBoardsForDisplay(ApplicationUser user) {
        return boardConfigurationManager.getBoardsJson(user, false);
    }

    @Override
    public String getChangesJson(ApplicationUser user, boolean backlog, String code, int viewId) throws SearchException {
        return boardManager.getChangesJson(user, backlog, code, viewId);
    }

    @Override
    public void saveCustomFieldIds(ApplicationUser user, ModelNode idNode) {
        boardConfigurationManager.saveCustomFieldIds(user, idNode);
    }

    @Override
    public String getStateHelpTexts(ApplicationUser user, String boardCode) {
        return boardConfigurationManager.getStateHelpTextsJson(user, boardCode);
    }

    @Override
    public String getOverbaardVersion() {
        return overbaardVersion;
    }


    @Override
    public void logUserAccess(ApplicationUser user, String boardCode, String userAgent) {
        userAccessManager.logUserAccess(user, boardCode, userAgent);
    }

    @Override
    public String getUserAccessJson(ApplicationUser user) {
        return userAccessManager.getUserAccessJson(user);
    }

    @Override
    public void updateParallelTaskForIssue(ApplicationUser user, String boardCode, String issueKey, int groupIndex, int taskIndex, int optionIndex) throws SearchException{
        try {
            boardManager.updateParallelTaskForIssue(user, boardCode, issueKey, groupIndex, taskIndex, optionIndex);
        } catch (Exception e) {
            //Last parameter is the exception (it does not match a {} entry)
            OverbaardLogger.LOGGER.debug("BoardManagerImpl.handleEvent - Error updating board {}", boardCode, e);
            if (e instanceof SearchException || e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException(e);
        }
    }

    public String getBoardConfigurationHistory(ApplicationUser user, String restRootUrl, Integer cfgId, Integer fromId) {
        return boardConfigurationManager.getBoardConfigurationHistoryJson(user, restRootUrl, cfgId, fromId);
    }

    @Override
    public String getBoardConfigurationHistoryEntry(ApplicationUser user, Integer historyEntryId) {
        return boardConfigurationManager.getBoardConfigurationHistoryEntry(user, historyEntryId);
    }

    @Override
    public void afterPropertiesSet() throws Exception {

    }

    @Override
    public void destroy() throws Exception {

    }

}