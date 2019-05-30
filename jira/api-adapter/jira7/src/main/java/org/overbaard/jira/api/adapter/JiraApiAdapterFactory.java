package org.overbaard.jira.api.adapter;

import org.overbaard.jira.api.adapter.spi.JiraApiAdapter;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class JiraApiAdapterFactory {
    public static JiraApiAdapter getAdapter() {
        return JiraApiAdapterImpl.INSTANCE;
    }
}
