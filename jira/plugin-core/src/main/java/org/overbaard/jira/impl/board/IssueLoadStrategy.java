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

package org.overbaard.jira.impl.board;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.overbaard.jira.api.adapter.JiraApiAdapterFactory;
import org.overbaard.jira.api.adapter.spi.SearchResultsAdapter;
import org.overbaard.jira.impl.util.IndexedMap;

import com.atlassian.jira.bc.issue.search.SearchService;
import com.atlassian.jira.issue.search.SearchException;
import com.atlassian.jira.issue.search.SearchResults;
import com.atlassian.jira.jql.builder.JqlClauseBuilder;
import com.atlassian.jira.jql.builder.JqlQueryBuilder;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.web.bean.PagerFilter;
import com.atlassian.query.Query;
import com.atlassian.query.order.SortOrder;

/**
 * Strategy for how to load things like custom fields
 *
 * @author Kabir Khan
 */
interface IssueLoadStrategy {

    /**
     * Called for each issue. When called for an issue it will set
     * all custom fields and parallel task issues in the created issues.
     *
     * @param issue the Jira issue
     * @param builder the builder used to load the issue
     */
    void handle(com.atlassian.jira.issue.Issue issue, Issue.Builder builder);

    /**
     * Called when all issues have been loaded. Once this is complete all
     * epics and parent keys will have been added to the affected issues.
     */
    void finish();

    /**
     * This will be called during finish() and is used to get the rank order of Epics.
     *
     * @param searchService the search service
     * @param owner the owner of the board
     * @param unsortedEpics a map of all the epics
     * @return an indexed map containing all the epics in rank order
     */
    default IndexedMap<String, Epic> getEpicsInRankOrder(
            SearchService searchService,
            ApplicationUser owner,
            Map<String, Epic> unsortedEpics) {

        if (unsortedEpics.size() == 0) {
            return new IndexedMap<>(Collections.emptyMap());
        }

        final ClassLoader cl = RawSqlLoader.class.getClassLoader();
        if (!JiraApiAdapterFactory.getAdapter().getJiraEnvironmentAdapter().isRunningInJira()) {
            // For unit tests
            List<Epic> epics = new ArrayList<>(unsortedEpics.values());
            epics.sort(new Comparator<Epic>() {
                @Override
                public int compare(Epic o1, Epic o2) {
                    return o1.getName().compareTo(o2.getName());
                }
            });
            Map<String, Epic> map = new LinkedHashMap<>();
            for (Epic epic : epics) {
                map.put(epic.getKey(), epic);
            }
            return new IndexedMap<>(map);
        }

        HashSet<String> epicKeys = new HashSet<>();
        for (Epic epic : unsortedEpics.values()) {
            epicKeys.add(epic.getKey());
        }

        JqlQueryBuilder queryBuilder = JqlQueryBuilder.newBuilder();
        JqlClauseBuilder where = queryBuilder.where();

        where.issue(epicKeys.toArray(new String[epicKeys.size()]));
        queryBuilder.orderBy().addSortForFieldName("Rank", SortOrder.ASC, true);

        Query query = queryBuilder.buildQuery();

        try {
            final SearchResultsAdapter searchResultsAdapter = JiraApiAdapterFactory.getAdapter().getSearchResultsAdapter();
            final SearchResults searchResults =
                    searchService.search(owner, query, PagerFilter.getUnlimitedFilter());
            final Map<String, Epic> result = new LinkedHashMap<>();
            for (com.atlassian.jira.issue.Issue epicIssue : searchResultsAdapter.getIssueResults(searchResults)) {
                String key = epicIssue.getKey();
                result.put(key, unsortedEpics.get(key));
            }
            return new IndexedMap<>(result);
        } catch (SearchException e) {
            throw new RuntimeException(e);
        }
    }

    class Factory {

        static IssueLoadStrategy create(BoardProject.Builder project) {
            final boolean customFieldsOrParallelTasks =
                    project.getConfig().getCustomFieldNames().size() > 0 || project.getConfig().getInternalAdvanced().getParallelTaskGroupsConfig() != null;
            if (JiraApiAdapterFactory.getAdapter().getJiraEnvironmentAdapter().isRunningInJira()) {
                return new BulkIssueLoadStrategy(project, customFieldsOrParallelTasks);
            }
            //We are running in a unit test, so we don't use this strategy (see class javadoc)
            return new Issue.LazyLoadStrategy(project);
        }
    }
}
