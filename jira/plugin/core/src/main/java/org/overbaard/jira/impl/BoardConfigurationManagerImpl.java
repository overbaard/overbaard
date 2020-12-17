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

import static org.overbaard.jira.impl.Constants.BOARD_ID;
import static org.overbaard.jira.impl.Constants.CAN_EDIT_CUSTOM_FIELDS;
import static org.overbaard.jira.impl.Constants.CHANGED_BY;
import static org.overbaard.jira.impl.Constants.CHANGE_TYPE;
import static org.overbaard.jira.impl.Constants.CODE;
import static org.overbaard.jira.impl.Constants.CONFIG;
import static org.overbaard.jira.impl.Constants.CONFIGS;
import static org.overbaard.jira.impl.Constants.EDIT;
import static org.overbaard.jira.impl.Constants.ENTRIES;
import static org.overbaard.jira.impl.Constants.EPIC_LINK_CUSTOM_FIELD_ID;
import static org.overbaard.jira.impl.Constants.EPIC_NAME_CUSTOM_FIELD_ID;
import static org.overbaard.jira.impl.Constants.ID;
import static org.overbaard.jira.impl.Constants.NAME;
import static org.overbaard.jira.impl.Constants.OWNER;
import static org.overbaard.jira.impl.Constants.PROJECTS;
import static org.overbaard.jira.impl.Constants.RANK_CUSTOM_FIELD_ID;
import static org.overbaard.jira.impl.Constants.TIME;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;

import javax.inject.Inject;
import javax.inject.Named;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardPermissionException;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.api.BoardConfigurationManager;
import org.overbaard.jira.impl.activeobjects.BoardCfg;
import org.overbaard.jira.impl.activeobjects.BoardCfgHistory;
import org.overbaard.jira.impl.activeobjects.Setting;
import org.overbaard.jira.impl.config.BoardConfig;
import org.overbaard.jira.impl.config.BoardProjectConfig;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.permission.GlobalPermissionKey;
import com.atlassian.jira.permission.ProjectPermissions;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.security.GlobalPermissionManager;
import com.atlassian.jira.security.PermissionManager;
import com.atlassian.jira.security.groups.GroupManager;
import com.atlassian.jira.security.plugin.ProjectPermissionKey;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.sal.api.transaction.TransactionCallback;

import net.java.ao.DBParam;
import net.java.ao.Query;

/**
 * @author Kabir Khan
 */
@Named("overbaardBoardConfigurationManager")
public class BoardConfigurationManagerImpl implements BoardConfigurationManager {

    private static final int HISTORY_LIMIT = 50;
    private static final String OVERBAARD_ADMINS = "Overbaard Admins";

    private volatile Map<String, BoardConfig> boardConfigs = new ConcurrentHashMap<>();

    private final JiraInjectables jiraInjectables;

    /** Custom field ids */
    private volatile long rankCustomFieldId = -1;
    private volatile long epicLinkCustomFieldId = -1;
    private volatile long epicNameCustomFieldId = -1;

    @Inject
    public BoardConfigurationManagerImpl(JiraInjectables jiraInjectables) {
        this.jiraInjectables = jiraInjectables;
    }

    @Override
    public String getBoardsJson(ApplicationUser user, boolean forConfig) {
        Set<BoardCfg> configs = loadBoardConfigs();
        ModelNode configsList = new ModelNode();
        configsList.setEmptyList();
        for (BoardCfg config : configs) {
            ModelNode configNode = new ModelNode();
            configNode.get(ID).set(config.getID());
            configNode.get(CODE).set(config.getCode());
            configNode.get(NAME).set(config.getName());
            ModelNode configJson = ModelNode.fromJSONString(config.getConfigJson());
            if (forConfig) {
                if (canEditBoard(user, configJson)) {
                    configNode.get(EDIT).set(true);
                }
                configsList.add(configNode);
            } else {
                //A guess at what is needed to view the boards
                if (canViewBoard(user, configNode)) {
                    configsList.add(configNode);
                }
            }
        }

        //Add a few more fields
        ModelNode config = new ModelNode();
        config.get(CONFIGS).set(configsList);

        if (forConfig) {
            config.get(CAN_EDIT_CUSTOM_FIELDS).set(canEditCustomFields(user));
            config.get(RANK_CUSTOM_FIELD_ID).set(getRankCustomFieldId());
            config.get(EPIC_LINK_CUSTOM_FIELD_ID).set(getEpicLinkCustomFieldId());
            config.get(EPIC_NAME_CUSTOM_FIELD_ID).set(getEpicNameCustomFieldId());
        }

        return config.toJSONString(true);
    }

    @Override
    public String getBoardJsonConfig(ApplicationUser user, int boardId) {
        // Note that for this path (basically for the configuration page) we don't validate the loaded
        // config. Otherwise if we break compatibility, people will not be able to fix it.
        BoardCfg[] cfgs = jiraInjectables.getActiveObjects().executeInTransaction(new TransactionCallback<BoardCfg[]>(){
            @Override
            public BoardCfg[] doInTransaction() {
                return jiraInjectables.getActiveObjects().find(BoardCfg.class, Query.select().where("ID = ?", boardId));
            }
        });
        ModelNode configJson = ModelNode.fromJSONString(cfgs[0].getConfigJson());
        return configJson.toJSONString(true);
    }

    @Override
    public BoardConfig getBoardConfigForBoardDisplay(ApplicationUser user, final String code) {
        BoardConfig boardConfig = getBoardConfig(code);

        if (boardConfig != null && !canViewBoard(user, boardConfig)) {
            throw new OverbaardPermissionException("Insufficient permissions to view board " +
                    boardConfig.getName() + " (" + code + ")");
        }
        return boardConfig;
    }

    @Override
    public BoardConfig getBoardConfig(final String code) {
        BoardConfig boardConfig =  boardConfigs.get(code);
        if (boardConfig == null) {
            final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();
            BoardCfg[] cfgs = activeObjects.executeInTransaction(new TransactionCallback<BoardCfg[]>(){
                @Override
                public BoardCfg[] doInTransaction() {
                    return activeObjects.find(BoardCfg.class, Query.select().where("CODE = ?", code));
                }
            });

            if (cfgs != null && cfgs.length == 1) {
                BoardCfg cfg = cfgs[0];
                boardConfig = BoardConfig.loadAndValidate(jiraInjectables, cfg.getID(),
                        cfg.getOwningUser(), cfg.getConfigJson(), getRankCustomFieldId(),
                        getEpicLinkCustomFieldId(), getEpicNameCustomFieldId());

                BoardConfig old = boardConfigs.putIfAbsent(code, boardConfig);
                if (old != null) {
                    boardConfig = old;
                }
            }
        }
        return boardConfig;
    }

    @Override
    public BoardConfig saveBoard(ApplicationUser user, final int id, final ModelNode config) {
        final String code = config.get(CODE).asString();
        final String name = config.get(NAME).asString();

        //Validate it, and serialize it so that the order of fields is always the same
        final BoardConfig boardConfig;
        final ModelNode validConfig;
        try {
            boardConfig = BoardConfig.loadAndValidate(jiraInjectables, id,
                    user.getKey(), config, getRankCustomFieldId(),
                    getEpicLinkCustomFieldId(), getEpicNameCustomFieldId());

            validConfig = boardConfig.serializeModelNodeForConfig();
        } catch (Exception e) {
            throw new OverbaardValidationException("Invalid data: " + e.getMessage());
        }

        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();

        activeObjects.executeInTransaction(new TransactionCallback<Void>() {
            @Override
            public Void doInTransaction() {
                if (!canEditBoard(user, validConfig)) {
                    if (id >= 0) {
                        throw new OverbaardPermissionException("Insufficient permissions to edit board '" +
                                validConfig.get(NAME) + "' (" + id + ")");
                    } else {
                        throw new OverbaardPermissionException("Insufficient permissions to create board '" +
                                validConfig.get(NAME) + "'");
                    }
                }

                final String historyAction;
                final BoardCfg cfg;
                if (id >= 0) {
                    cfg = activeObjects.get(BoardCfg.class, id);
                    cfg.setCode(code);
                    cfg.setName(name);
                    cfg.setOwningUserKey(user.getKey());
                    cfg.setConfigJson(validConfig.toJSONString(true));
                    cfg.save();
                    historyAction = "U";
                } else {
                    cfg = activeObjects.create(
                            BoardCfg.class,
                            new DBParam("CODE", code),
                            new DBParam("NAME", name),
                            new DBParam("OWNING_USER", user.getKey()),
                            //Compact the json before saving it
                            new DBParam("CONFIG_JSON", validConfig.toJSONString(true)));
                    cfg.save();
                    historyAction = "C";
                }

                // Add a history entry
                try {
                    BoardCfgHistory history = activeObjects.create(
                            BoardCfgHistory.class,
                            new DBParam("CODE", code),
                            new DBParam("NAME", name),
                            new DBParam("OWNING_USER", user.getKey()),
                            new DBParam("CHANGING_USER", user.getKey()),
                            new DBParam("CONFIG_JSON", validConfig.toJSONString(true)),
                            new DBParam("BOARD_CFG_ID", cfg.getID()),
                            new DBParam("MODIFIED", new Date()),
                            new DBParam("ACTION", historyAction)
                    );
                    history.save();
                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (id >= 0) {
                    boardConfigs.remove(code);
                }
                return null;
            }
        });
        return boardConfig;
    }

    @Override
    public String deleteBoard(ApplicationUser user, int id) {
        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();

        final String code = activeObjects.executeInTransaction(new TransactionCallback<String>() {
            @Override
            public String doInTransaction() {
                BoardCfg cfg = activeObjects.get(BoardCfg.class, id);
                if (cfg == null) {
                    return null;
                }
                final String code = cfg.getCode();
                final ModelNode boardConfig = ModelNode.fromJSONString(cfg.getConfigJson());
                if (!canEditBoard(user, boardConfig)) {
                    throw new OverbaardPermissionException("Insufficient permissions to delete board '" +
                            boardConfig.get(NAME) + "' (" + id + ")");
                }
                activeObjects.delete(cfg);

                // Add a history entry
                BoardCfgHistory history = activeObjects.create(
                        BoardCfgHistory.class,
                        new DBParam("CODE", code),
                        new DBParam("NAME", cfg.getName()),
                        new DBParam("OWNING_USER", cfg.getOwningUser()),
                        new DBParam("CHANGING_USER", user.getKey()),
                        new DBParam("CONFIG_JSON", cfg.getConfigJson()),
                        new DBParam("BOARD_CFG_ID", cfg.getID()),
                        new DBParam("MODIFIED", new Date()),
                        new DBParam("ACTION", "D")
                );
                history.save();


                return code;
            }
        });
        if (code != null) {
            boardConfigs.remove(code);
        }
        return code;
    }

    @Override
    public List<String> getBoardCodesForProjectCode(String projectCode) {
        //For now just iterate
        List<String> boardCodes = new ArrayList<>();
        for (Map.Entry<String, BoardConfig> entry : boardConfigs.entrySet()) {
            if (entry.getValue().getBoardProject(projectCode) != null) {
                boardCodes.add(entry.getKey());
            }
        }
        return boardCodes;
    }

    @Override
    public void saveCustomFieldIds(ApplicationUser user, ModelNode idsNode) {
        if (!canEditCustomFields(user)) {
            throw new OverbaardPermissionException("Only Jira Administrators can edit the custom field id");
        }

        for (String customFieldKey : idsNode.keys()) {
            try {
                idsNode.get(customFieldKey).asInt();
            } catch (Exception e) {
                throw new OverbaardValidationException(customFieldKey + " needs to be a number");
            }
        }

        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();

        activeObjects.executeInTransaction(new TransactionCallback<Void>() {
            @Override
            public Void doInTransaction() {

                for (String customFieldKey : idsNode.keys()) {
                    String customFieldId = idsNode.get(customFieldKey).asString();

                    Setting[] settings =  activeObjects.find(Setting.class, Query.select().where("NAME = ?", customFieldKey));
                    if (settings.length == 0) {
                        //Insert
                        final Setting setting = activeObjects.create(
                                Setting.class,
                                new DBParam("NAME", customFieldKey),
                                new DBParam("VALUE", customFieldId));
                        setting.save();
                    } else {
                        //update
                        Setting setting = settings[0];
                        setting.setValue(customFieldId);
                        setting.save();
                    }

                    // Set these to -1 so that they are reloaded. This is the safest if the Tx fails
                    switch (customFieldKey) {
                        case RANK_CUSTOM_FIELD_ID:
                            rankCustomFieldId = -1;
                            break;
                        case EPIC_LINK_CUSTOM_FIELD_ID:
                            epicLinkCustomFieldId = -1;
                            break;
                        case EPIC_NAME_CUSTOM_FIELD_ID:
                            epicNameCustomFieldId = -1;
                    }
                }
                return null;
            }
        });

    }

    @Override
    public String getStateHelpTextsJson(ApplicationUser user, String boardCode) {
        BoardConfig cfg = getBoardConfigForBoardDisplay(user, boardCode);
        Map<String, String> helpTexts = cfg.getStateHelpTexts();
        ModelNode output = new ModelNode();
        output.setEmptyObject();
        for (Map.Entry<String, String> entry : helpTexts.entrySet()) {
            output.get(entry.getKey()).set(entry.getValue());
        }
        return output.toJSONString(true);
    }

    private Set<BoardCfg> loadBoardConfigs() {
        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();

        return activeObjects.executeInTransaction(new TransactionCallback<Set<BoardCfg>>(){
            @Override
            public Set<BoardCfg> doInTransaction() {
                Set<BoardCfg> configs = new TreeSet<>((o1, o2) -> {
                    return o1.getName().compareTo(o2.getName());
                });
                for (BoardCfg boardCfg : activeObjects.find(BoardCfg.class)) {
                    configs.add(boardCfg);

                }
                return configs;
            }
        });
    }

    public long getRankCustomFieldId() {
        long id = this.rankCustomFieldId;
        if (id < 0) {
            id = loadCustomFieldId(RANK_CUSTOM_FIELD_ID);
            this.rankCustomFieldId = id;
        }
        return id;
    }

    public long getEpicLinkCustomFieldId() {
        long id = this.epicLinkCustomFieldId;
        if (id < 0) {
            id = loadCustomFieldId(EPIC_LINK_CUSTOM_FIELD_ID);
            this.epicLinkCustomFieldId = id;
        }
        return id;
    }

    public long getEpicNameCustomFieldId() {
        long id = this.epicNameCustomFieldId;
        if (id < 0) {
            id = loadCustomFieldId(EPIC_NAME_CUSTOM_FIELD_ID);
            this.epicNameCustomFieldId = id;
        }
        return id;
    }

    private long loadCustomFieldId(String name) {
        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();

        Setting[] settings = activeObjects.executeInTransaction(new TransactionCallback<Setting[]>() {
            @Override
            public Setting[] doInTransaction() {
                return activeObjects.find(Setting.class, Query.select().where("NAME = ?", name));
            }
        });
        if (settings.length == 1) {
            return Long.valueOf(settings[0].getValue());
        }
        return -1;
    }

    @Override
    public String getBoardConfigurationHistoryJson(ApplicationUser user, String restRootUrl, Integer cfgId, Integer fromId) {
        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();
        // Unfortunately select distinct doesn't work, so just do a paged thing
        Query query = Query.select()
                .order("MODIFIED DESC");

        StringBuilder whereClause = new StringBuilder();
        List<Object> whereParams = new ArrayList<>();
        if (fromId != null && fromId > 0) {
            whereClause.append("ID < ?");
            whereParams.add(fromId);
        }
        if (cfgId != null) {
            if (whereClause.length() > 0) {
                whereClause.append(" AND ");
            }
            whereClause.append("BOARD_CFG_ID = ?");
            whereParams.add(cfgId);
        }
        if (whereClause.length() > 0) {
            query.where(whereClause.toString(), whereParams.toArray());
        }
        query = query.limit(HISTORY_LIMIT);
        final Query theQuery = query;


        BoardCfgHistory[] history = activeObjects.executeInTransaction(new TransactionCallback<BoardCfgHistory[]>() {
            @Override
            public BoardCfgHistory[] doInTransaction() {
                return activeObjects.find(BoardCfgHistory.class, theQuery);
            }
        });

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd\'T\'HH:mmZ");
        ModelNode historyList = new ModelNode().setEmptyList();
        int startId = fromId == null ? 0 : fromId + 1;
        int endId = 0;
        for (BoardCfgHistory h : history) {
            if (startId == 0) {
                startId = h.getID();
            }
            endId = h.getID();

            ModelNode entry = new ModelNode();
            entry.get(ID).set(h.getID());
            entry.get(CODE).set(h.getCode());
            entry.get(BOARD_ID).set(h.getBoardCfgId());
            entry.get(CHANGED_BY).set(h.getChangingUser());
            entry.get(CHANGE_TYPE).set(formatChangeType(h));
            entry.get(TIME).set(formatDate(h.getModified()));
            entry.get("url").set(restRootUrl + "/" + h.getID());
            historyList.add(entry);
        }

        ModelNode result = new ModelNode();
        if (history.length == HISTORY_LIMIT) {
            String nextPath = "?from=" + endId;
            if (cfgId != null) {
                nextPath += "&" + BOARD_ID +"=" + cfgId;
            }
            result.get("next").set(restRootUrl + nextPath);
        }
        result.get(ENTRIES).set(historyList);

        return result.toJSONString(false);
    }

    @Override
    public String getBoardConfigurationHistoryEntry(ApplicationUser user, Integer historyEntryId) {
        final ActiveObjects activeObjects = jiraInjectables.getActiveObjects();
        BoardCfgHistory history = activeObjects.executeInTransaction(new TransactionCallback<BoardCfgHistory[]>() {
            @Override
            public BoardCfgHistory[] doInTransaction() {
                return activeObjects.find(BoardCfgHistory.class, Query.select().where("ID = ?", historyEntryId));
            }
        })[0];

        ModelNode historyNode = new ModelNode();
        historyNode.get(ID).set(history.getID());
        historyNode.get(NAME).set(history.getName());
        historyNode.get(CODE).set(history.getCode());
        historyNode.get(OWNER).set(history.getOwningUser());
        historyNode.get(BOARD_ID).set(history.getBoardCfgId());
        historyNode.get(CHANGED_BY).set(history.getChangingUser());
        historyNode.get(CHANGE_TYPE).set(formatChangeType(history));
        historyNode.get(TIME).set(formatDate(history.getModified()));
        historyNode.get(CONFIG).set(ModelNode.fromJSONString(history.getConfigJson()));

        return historyNode.toJSONString(false);
    }

    private String formatDate(Date date) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd\'T\'HH:mmZ");
        return format.format(date);
    }

    private String formatChangeType(BoardCfgHistory h) {
        String changeType = "Updated";
        if (h.getAction().equals("D")) {
            changeType = "Deleted";
        } else if (h.getAction().equals("C")){
            changeType = "Created";
        }
        return changeType;
    }

    //Permission methods
    private boolean canEditBoard(ApplicationUser user, ModelNode boardConfig) {
        System.out.println("Check canEdit");
        return hasPermissionBoard(user, boardConfig, ProjectPermissions.ADMINISTER_PROJECTS);
    }

    private boolean canViewBoard(ApplicationUser user, ModelNode boardConfig) {
        //A wild guess at a reasonable permission needed to view the boards
        System.out.println("Check canView");
        return hasPermissionBoard(user, boardConfig, ProjectPermissions.TRANSITION_ISSUES);
    }

    private boolean canViewBoard(ApplicationUser user, BoardConfig boardConfig) {
        //A wild guess at a reasonable permission needed to view the boards
        System.out.println("Check canView 2");
        return hasPermissionBoard(user, boardConfig, ProjectPermissions.TRANSITION_ISSUES);
    }

    private boolean canEditCustomFields(ApplicationUser user) {
        //Only Jira Administrators can tweak the custom field ids
        return isJiraAdministrator(user);
    }

    private boolean hasPermissionBoard(ApplicationUser user, BoardConfig boardConfig, ProjectPermissionKey... permissions) {
        for (BoardProjectConfig boardProject : boardConfig.getBoardProjects()) {
            if (!hasPermission(user, boardProject.getCode(), permissions)) {
                return false;
            }
        }
        return true;
    }


    private boolean hasPermissionBoard(ApplicationUser user, ModelNode boardConfig, ProjectPermissionKey...permissions) {
        System.out.println("Cheking permission for " + boardConfig);
        if (isJiraAdministrator(user)) {
            return true;
        }
        if (isOverbaardAdmin(user)) {
            return true;
        }

        if (!boardConfig.hasDefined(PROJECTS)) {
            //The project is empty, start checking once they add something
            return true;
        }
        for (ModelNode project : boardConfig.get(PROJECTS).asList()) {
            String projectCode = project.get(CODE).asString();
            if (!hasPermission(user, projectCode, permissions)) {
                return false;
            }
        }
        return true;
    }

    private boolean hasPermission(ApplicationUser user, String projectCode, ProjectPermissionKey[] permissions) {
        if (isJiraAdministrator(user)) {
            return true;
        }
        if (isOverbaardAdmin(user)) {
            return true;
        }

        final ProjectManager projectManager = jiraInjectables.getProjectManager();
        final PermissionManager permissionManager = jiraInjectables.getPermissionManager();

        Project project = projectManager.getProjectByCurrentKey(projectCode);
        for (ProjectPermissionKey permission : permissions) {
            if (!permissionManager.hasPermission(permission, project, user)) {
                return false;
            }
        }
        return true;
    }

    private boolean isJiraAdministrator(ApplicationUser user) {
        final GlobalPermissionManager globalPermissionManager = jiraInjectables.getGlobalPermissionManager();

        return globalPermissionManager.hasPermission(GlobalPermissionKey.ADMINISTER, user);
    }

    private boolean isOverbaardAdmin(ApplicationUser user) {
        final GroupManager groupManager = jiraInjectables.getGroupManager();

        if (groupManager.isUserInGroup(user, OVERBAARD_ADMINS)) {
            return true;
        }
        return false;
    }
}
