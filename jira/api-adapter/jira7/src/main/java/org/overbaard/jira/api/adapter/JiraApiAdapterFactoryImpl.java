package org.overbaard.jira.api.adapter;

import org.overbaard.jira.api.adapter.spi.TestInterface;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
class JiraApiAdapterFactoryImpl implements org.overbaard.jira.api.adapter.spi.JiraApiAdapterFactory {

    static JiraApiAdapterFactoryImpl INSTANCE = new JiraApiAdapterFactoryImpl();

    private JiraApiAdapterFactoryImpl() {
    }

    @Override
    public TestInterface getTestInterface() {
        return new TestInterfaceImpl();
    }
}
