package org.overbaard.jira.api;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.overbaard.jira.impl.board.SortedFieldOptions;

/**
 * Options for the parallel tasks defined for a project and their issue type overrides
 *
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ParallelTaskOptions {
    private final Map<String, SortedFieldOptions.ParallelTasks> parallelTaskOptions;
    private final Map<String, Map<String, SortedFieldOptions.ParallelTasks>> issueTypeParallelTaskOptions;
    private InternalAdvanced internalAdvanced;

    private ParallelTaskOptions(
            Map<String, SortedFieldOptions.ParallelTasks> parallelTaskOptions,
            Map<String, Map<String, SortedFieldOptions.ParallelTasks>> issueTypeParallelTaskOptions) {

        this.parallelTaskOptions = Collections.unmodifiableMap(parallelTaskOptions);

        Map<String, Map<String, SortedFieldOptions.ParallelTasks>> tmp = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, SortedFieldOptions.ParallelTasks>> override : issueTypeParallelTaskOptions.entrySet()) {
            tmp.put(override.getKey(), Collections.unmodifiableMap(override.getValue()));
        }
        this.issueTypeParallelTaskOptions = Collections.unmodifiableMap(tmp);
        internalAdvanced = new InternalAdvanced();
    }

    public static ParallelTaskOptions create(
            Map<String, SortedFieldOptions.ParallelTasks> parallelTaskValues,
            Map<String, Map<String, SortedFieldOptions.ParallelTasks>> overrides) {
        return new ParallelTaskOptions(parallelTaskValues, overrides);
    }

    public Map<String, SortedFieldOptions.ParallelTasks> getOptions(String issueType) {
        Map<String, SortedFieldOptions.ParallelTasks> map = issueTypeParallelTaskOptions.get(issueType);
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
        public Map<String, SortedFieldOptions.ParallelTasks> getOptionsForProject() {
            return parallelTaskOptions;
        }

        public Map<String, SortedFieldOptions.ParallelTasks> getOptionsForIssueType(String issueType) {
            return issueTypeParallelTaskOptions.get(issueType);
        }

    }
}
