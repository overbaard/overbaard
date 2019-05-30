package org.overbaard.jira.api.adapter.spi;

import java.util.List;

import com.atlassian.jira.issue.Issue;
import com.atlassian.jira.issue.search.SearchResults;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public interface SearchResultsAdapter {
    List<Issue> getIssueResults(SearchResults searchResults);
}
