package org.overbaard.jira.api.adapter.spi;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public interface JiraApiAdapter {

    JiraEnvironmentAdapter getJiraEnvironmentAdapter();

    SearchResultsAdapter getSearchResultsAdapter();
}
