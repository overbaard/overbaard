package org.overbaard.jira.api.adapter.jira8;

import org.apache.felix.framework.BundleWiringImpl;
import org.overbaard.jira.api.adapter.spi.JiraEnvironmentAdapter;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
class JiraEnvironmentAdapterImpl implements JiraEnvironmentAdapter {
    @Override
    public boolean isRunningInJira() {
        return this.getClass().getClassLoader() instanceof BundleWiringImpl.BundleClassLoader;
    }
}
