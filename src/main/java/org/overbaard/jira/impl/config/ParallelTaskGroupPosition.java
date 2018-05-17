package org.overbaard.jira.impl.config;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class ParallelTaskGroupPosition {
    private final int groupIndex;
    private final int taskIndex;

    public ParallelTaskGroupPosition(int groupIndex, int taskIndex) {
        this.groupIndex = groupIndex;
        this.taskIndex = taskIndex;
    }

    public int getGroupIndex() {
        return groupIndex;
    }

    public int getTaskIndex() {
        return taskIndex;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ParallelTaskGroupPosition position = (ParallelTaskGroupPosition) o;

        if (groupIndex != position.groupIndex) return false;
        return taskIndex == position.taskIndex;
    }

    @Override
    public int hashCode() {
        int result = groupIndex;
        result = 31 * result + taskIndex;
        return result;
    }

    public String toString() {
        return "{" + groupIndex + ", " + taskIndex + "}";
    }
}
