package org.overbaard.jira.api.adapter.jira9;

import java.util.List;

import org.overbaard.jira.api.adapter.spi.SearchResultsAdapter;

import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.search.SearchResults;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class SearchResultsAdapterImpl implements SearchResultsAdapter {
    @Override
    public List<Issue> getIssueResults(SearchResults searchResults) {
        return (List<Issue>)searchResults.getResults();
    }
}
