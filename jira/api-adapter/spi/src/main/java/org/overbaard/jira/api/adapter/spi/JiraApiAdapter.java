package org.overbaard.jira.api.adapter.spi;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.ServiceLoader;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public interface JiraApiAdapter {

    JiraEnvironmentAdapter getJiraEnvironmentAdapter();

    SearchResultsAdapter getSearchResultsAdapter();

    class Factory {
        private static volatile JiraApiAdapter adapter;
        public static JiraApiAdapter get() {
            if (adapter == null) {
                synchronized (JiraApiAdapter.class) {
                    if (adapter == null) {
                        ServiceLoader<JiraApiAdapter> loader = ServiceLoader.load(JiraApiAdapter.class);
                        List<JiraApiAdapter> adapters = new ArrayList<>();
                        for (Iterator<JiraApiAdapter> it = loader.iterator() ; it.hasNext() ; ) {
                            JiraApiAdapter curr = it.next();
                            adapters.add(curr);
                        }

                        if (adapters.size() == 0) {
                            throw new IllegalStateException("No JiraApiAdapter implementation found");
                        }
                        if (adapters.size() > 1) {
                            throw new IllegalStateException("More than one JiraApiAdapter found: " + adapters);
                        }
                        adapter = adapters.get(0);
                    }
                }
            }
            return adapter;
        }
    }
}
