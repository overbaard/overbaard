package org.overbaard.jira.api.adapter;

import org.overbaard.jira.api.adapter.spi.JiraApiAdapterFactory;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class JiraApiAdapterAbstractFactory {
    public static JiraApiAdapterFactory getAdapterFactory() {
        return JiraApiAdapterFactoryImpl.INSTANCE;
    }
}
