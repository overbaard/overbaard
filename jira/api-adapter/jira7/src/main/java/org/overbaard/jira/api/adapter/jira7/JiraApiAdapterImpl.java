package org.overbaard.jira.api.adapter.jira7;

import org.overbaard.jira.api.adapter.spi.JiraApiAdapter;
import org.overbaard.jira.api.adapter.spi.JiraEnvironmentAdapter;
import org.overbaard.jira.api.adapter.spi.SearchResultsAdapter;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class JiraApiAdapterImpl implements JiraApiAdapter {

    static JiraApiAdapterImpl INSTANCE = new JiraApiAdapterImpl();
    private final JiraEnvironmentAdapter jiraEnvironmentAdapter = new JiraEnvironmentAdapterImpl();
    private final SearchResultsAdapter searchResultsAdapter = new SearchResultsAdapterImpl();

    /**
     * This should not be called directly but be instantiated via a service loader
     */
    @Deprecated
    public JiraApiAdapterImpl() {
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
