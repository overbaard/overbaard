package org.overbaard.jira.api;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.overbaard.jira.impl.board.SortedParallelTaskFieldOptions;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ParallelTaskOptions {
    private final Map<String, SortedParallelTaskFieldOptions> parallelTaskOptions;
    private final Map<String, Map<String, SortedParallelTaskFieldOptions>> issueTypeParallelTaskOptions;
    private InternalAdvanced internalAdvanced;

    private ParallelTaskOptions(
            Map<String, SortedParallelTaskFieldOptions> parallelTaskOptions,
            Map<String, Map<String, SortedParallelTaskFieldOptions>> issueTypeParallelTaskOptions) {

        this.parallelTaskOptions = Collections.unmodifiableMap(parallelTaskOptions);

        Map<String, Map<String, SortedParallelTaskFieldOptions>> tmp = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, SortedParallelTaskFieldOptions>> override : issueTypeParallelTaskOptions.entrySet()) {
            tmp.put(override.getKey(), Collections.unmodifiableMap(override.getValue()));
        }
        this.issueTypeParallelTaskOptions = Collections.unmodifiableMap(tmp);
        internalAdvanced = new InternalAdvanced();
    }

    public static ParallelTaskOptions create(
            Map<String, SortedParallelTaskFieldOptions> parallelTaskValues,
            Map<String, Map<String, SortedParallelTaskFieldOptions>> overrides) {
        return new ParallelTaskOptions(parallelTaskValues, overrides);
    }

    public Map<String, SortedParallelTaskFieldOptions> getOptions(String issueType) {
        Map<String, SortedParallelTaskFieldOptions> map = issueTypeParallelTaskOptions.get(issueType);
        if (map != null) {
            return map;
        }
        return parallelTaskOptions;
    }

    public InternalAdvanced getInternalAdvanced() {
        return internalAdvanced;
    }

    /**
     * Use this to encourage people to call {@link #getOptions(String)} instead for the normal usage
     */
    public class InternalAdvanced {
        public Map<String, SortedParallelTaskFieldOptions> getOptionsForProject() {
            return parallelTaskOptions;
        }

        public Map<String, SortedParallelTaskFieldOptions> getOptionsForIssueType(String issueType) {
            return issueTypeParallelTaskOptions.get(issueType);
        }

    }
}
