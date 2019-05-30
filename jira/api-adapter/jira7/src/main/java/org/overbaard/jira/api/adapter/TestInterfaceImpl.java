package org.overbaard.jira.api.adapter;

import org.overbaard.jira.api.adapter.spi.TestInterface;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
class TestInterfaceImpl implements TestInterface {

    @Override
    public void sample() {
        System.out.println("======> IN SAMPLE!!!!");
    }
}
