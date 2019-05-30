package org.overbaard.jira.api.adapter;

import org.overbaard.jira.api.adapter.spi.JiraApiAdapter;
import org.overbaard.jira.api.adapter.spi.JiraEnvironmentAdapter;
import org.overbaard.jira.api.adapter.spi.SearchResultsAdapter;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
class JiraApiAdapterImpl implements JiraApiAdapter {

    static JiraApiAdapterImpl INSTANCE = new JiraApiAdapterImpl();
    private final JiraEnvironmentAdapter jiraEnvironmentAdapter = new JiraEnvironmentAdapterImpl();
    private final SearchResultsAdapter searchResultsAdapter = new SearchResultsAdapterImpl();

    private JiraApiAdapterImpl() {
    }

    @Override
    public JiraEnvironmentAdapter getJiraEnvironmentAdapter() {
        return jiraEnvironmentAdapter;
    }

    @Override
    public SearchResultsAdapter getSearchResultsAdapter() {
        return searchResultsAdapter;
    }
}
