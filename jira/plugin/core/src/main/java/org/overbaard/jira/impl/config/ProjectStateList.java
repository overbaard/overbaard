package org.overbaard.jira.impl.config;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ProjectStateList {
    private final List<String> statesList;
    private final Map<String, Integer> states;

    public ProjectStateList(Map<String, Integer> states) {
        this.states = states;

        List<String> statesList = new ArrayList<>(states.size());
        for (String state : states.keySet()) {
            statesList.add(state);
        }
        this.statesList = Collections.unmodifiableList(statesList);
    }

    public Map<String, Integer> getStates() {
        return states;
    }

    public Set<String> getStateNames() {
        return states.keySet();
    }

    public Integer getStateIndex(String stateName) {
        return states.get(stateName);
    }

    public String getStateName(int index) {
        return statesList.get(index);
    }
}
