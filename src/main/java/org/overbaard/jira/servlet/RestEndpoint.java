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
package org.overbaard.jira.servlet;

import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.OverbaardValidationException;
import org.overbaard.jira.api.JiraFacade;
import org.overbaard.jira.impl.Constants;
import org.overbaard.jira.impl.board.RawSqlLoader;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.security.JiraAuthenticationContext;
import com.atlassian.jira.user.ApplicationUser;

/**
 * @author Kabir Khan
 */
@Path("/")
@Consumes({MediaType.APPLICATION_JSON})
@Produces({MediaType.APPLICATION_JSON})
public class RestEndpoint {

    /**
     * If we change anything in the payloads etc. we should bump this so that the client can take action.
     * The corresponding location on the client is in app.ts
     */
    private static final int API_VERSION = 2;

    private final JiraFacade jiraFacade;

    @Inject
    public RestEndpoint(JiraFacade jiraFacade) {
        this.jiraFacade = jiraFacade;
    }

    @GET
    @Path(Constants.VERSION)
    public Response getVersion() {
        ModelNode versionNode = new ModelNode();
        //Remove this later
        versionNode.get(Constants.VERSION).set(API_VERSION);
        versionNode.get(Constants.API_VERSION).set(API_VERSION);
        versionNode.get(Constants.OVERBAARD_VERSION).set(jiraFacade.getOverbaardVersion());
        return createResponse(versionNode);
    }

    @GET
    @Path(Constants.BOARDS)
    public Response getBoards(@QueryParam("full") Boolean full) {
        final String json;
        try {
            if (full != null && full.booleanValue()) {
                json = jiraFacade.getBoardConfigurations(getUser());
            } else {
                json = jiraFacade.getBoardsForDisplay(getUser());
            }
            return createResponse(json);
        } catch (RuntimeException e) {
            e.printStackTrace();
            throw e;
        }
    }

    @GET
    @Path(Constants.ISSUES + "/{boardCode}")
    public Response getBoard(
            @Context HttpServletRequest req,
            @HeaderParam("user-agent") String userAgent,
            @PathParam("boardCode") String boardCode,
            @QueryParam("backlog") Boolean backlog) throws SearchException {

        //Only log the access if we:
        // * Changed the board, or
        // * An hour has gone since the last access
        HttpSession session = req.getSession();
        String lastBoard = (String)session.getAttribute(Constants.CURRENT_BOARD);
        boolean changedBoard = !boardCode.equals(lastBoard);
        Long lastAccess =
                session.getAttribute(Constants.CURRENT_BOARD_LAST_LOGGED_ACCESS) == null ? 0 : (Long)session.getAttribute(Constants.CURRENT_BOARD_LAST_LOGGED_ACCESS);
        boolean timeout = System.currentTimeMillis() > TimeUnit.HOURS.toMillis(1) + lastAccess;
        if (changedBoard || timeout) {
            jiraFacade.logUserAccess(getUser(), boardCode, userAgent);
            session.setAttribute(Constants.CURRENT_BOARD, boardCode);
            session.setAttribute(Constants.CURRENT_BOARD_LAST_LOGGED_ACCESS, System.currentTimeMillis());
        }

        //TODO figure out if a permission violation becomes a search exception
        return createResponse(
                jiraFacade.getBoardJson(
                        getUser(),
                        backlog != null && backlog.booleanValue(),
                        boardCode));
    }

    @GET
    @Path(Constants.ISSUES + "/{boardCode}/" + Constants.UPDATES + "/{viewId}")
    public Response getBoard(@PathParam("boardCode") String boardCode,
                              @PathParam("viewId") int viewId,
                              @QueryParam("backlog") Boolean backlog) throws SearchException {
        //TODO figure out if a permission violation becomes a search exception
        return createResponse(
                jiraFacade.getChangesJson(getUser(),
                        backlog != null && backlog.booleanValue(),
                        boardCode,
                        viewId));
    }

    @GET
    @Path(Constants.ISSUES + "/{boardCode}/" + Constants.HELP)
    public Response getBoard(
            @PathParam("boardCode") String boardCode) throws SearchException {
        //TODO figure out if a permission violation becomes a search exception
        return createResponse(
                jiraFacade.getStateHelpTexts(getUser(), boardCode));
    }

    //issues/' + boardName + "/parallel/" + issueKey ;

    @PUT
    @Path(Constants.ISSUES + "/{boardCode}/parallel/{issueKey}")
    public Response updateParallelTask(
            @PathParam("boardCode") String boardCode,
            @PathParam("issueKey") String issueKey, String body) throws SearchException {

        ModelNode bodyNode = ModelNode.fromJSONString(body);
        int groupIndex = bodyNode.get("group-index").asInt();
        int taskIndex = bodyNode.get("task-index").asInt();
        int optionIndex = bodyNode.get("option-index").asInt();

        jiraFacade.updateParallelTaskForIssue(getUser(), boardCode, issueKey, groupIndex, taskIndex, optionIndex);
        return createResponse("{}");
    }

    @GET
    @Path(Constants.BOARDS + "/{boardId}")
    public Response getBoardConfig(@PathParam("boardId") int boardId) {
        ApplicationUser user = getUser();
        String json = jiraFacade.getBoardJsonForConfig(user, boardId);
        return createResponse(json);
    }

    @DELETE
    @Path(Constants.BOARDS + "/{boardId}")
    public Response deleteBoard(@PathParam("boardId") int boardId) {
        ApplicationUser user = getUser();
        jiraFacade.deleteBoardConfiguration(user, boardId);
        String json = jiraFacade.getBoardConfigurations(user);
        return createResponse(json);
    }

    @POST
    @Path(Constants.BOARDS)
    public Response createBoard(@Context HttpServletRequest req, String config) {
        ApplicationUser user = getUser();
        jiraFacade.saveBoardConfiguration(user, -1, Util.getDeployedUrl(req), ModelNode.fromJSONString(config));
        String json = jiraFacade.getBoardConfigurations(user);
        return createResponse(json);
    }

    @PUT
    @Path(Constants.BOARDS + "/{boardId}")
    public Response saveBoard(
            @Context HttpServletRequest req,
            @PathParam("boardId") int boardId,
            String config) {
        ApplicationUser user = getUser();
        jiraFacade.saveBoardConfiguration(user, boardId, Util.getDeployedUrl(req), ModelNode.fromJSONString(config));
        String json = jiraFacade.getBoardConfigurations(user);
        return createResponse(json);
    }

    @PUT
    @Path("customFieldIds")
    public Response saveCustomFieldIds(String value) {
        ApplicationUser user = getUser();
        jiraFacade.saveCustomFieldIds(user, ModelNode.fromJSONString(value));
        String json = "{}";
        return createResponse(json);
    }

    @POST
    @Path("db-explorer")
    public Response executeSql(@Context HttpServletRequest req, String queryJson) {
            ApplicationUser user = getUser();

        //Some lockdown of urls and users
        boolean valid = false;
        final String host = req.getHeader("host");
        if (host != null) {
            if (host.startsWith("localhost")) {
                if (user.getKey().equals("admin")) {
                    valid = true;
                }
            } else if (host.equals("issues.stage.jboss.org")) {
                if (user.getKey().equals("kabirkhan")) {
                    valid = true;
                }
            }
        }
        if (!valid) {
            throw new OverbaardValidationException("You are not allowed to execute sql queries on this server");
        }

        ModelNode node = ModelNode.fromJSONString(queryJson);
        String sql = node.get("sql").asString().trim();
        if (!sql.toUpperCase().startsWith("SELECT")) {
            throw new OverbaardValidationException("Only select statements are allowed");
        }

        //TODO configure this if needed
        RawSqlLoader loader = RawSqlLoader.create("defaultDS");
        return createResponse(loader.executeQuery(sql).toJSONString(true));
    }

    @GET
    @Path("access-log")
    public Response getUserAccesses() {
        ApplicationUser user = getUser();
        return createResponse(jiraFacade.getUserAccessJson(user));
    }

    private Response createResponse(ModelNode modelNode) {
        return createResponse(modelNode.toJSONString(true));
    }

    private Response createResponse(String json) {
        return Response.ok(json).build();
    }

    private ApplicationUser getUser() {
        //Jira doesn't seem to like injection of this
        JiraAuthenticationContext authenticationContext = ComponentAccessor.getJiraAuthenticationContext();
        return authenticationContext.getUser();
    }
}