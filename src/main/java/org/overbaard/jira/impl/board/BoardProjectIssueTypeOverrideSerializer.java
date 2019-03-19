package org.overbaard.jira.impl.board;

import static org.overbaard.jira.impl.Constants.OVERRIDE;
import static org.overbaard.jira.impl.Constants.PARALLEL_TASKS;
import static org.overbaard.jira.impl.Constants.STATE_LINKS;
import static org.overbaard.jira.impl.Constants.TYPE;

import java.util.function.BiConsumer;
import java.util.function.Consumer;

import org.jboss.dmr.ModelNode;
import org.overbaard.jira.api.ParallelTaskOptions;
import org.overbaard.jira.impl.config.BoardProjectConfig;
import org.overbaard.jira.impl.config.BoardProjectIssueTypeOverrideConfig;
import org.overbaard.jira.impl.config.BoardProjectIssueTypeOverrideConfig.StateLinksConfigOverride;
import org.overbaard.jira.impl.config.ParallelTaskCustomFieldConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskConfig;
import org.overbaard.jira.impl.config.ProjectParallelTaskGroupsConfig;

/**
 * @author <a href="mailto:kabir.khan@jboss.com">Kabir Khan</a>
 */
public class BoardProjectIssueTypeOverrideSerializer {
    private final BoardProjectIssueTypeOverrideConfig overrideConfig;
    private final BoardProjectConfig projectConfig;
    private final ParallelTaskOptions parallelTaskOptions;

    private BoardProjectIssueTypeOverrideSerializer(BoardProjectIssueTypeOverrideConfig overrideConfig, BoardProjectConfig projectConfig, ParallelTaskOptions parallelTaskOptions) {
        this.overrideConfig = overrideConfig;
        this.projectConfig = projectConfig;
        this.parallelTaskOptions = parallelTaskOptions;
    }

    static BoardProjectIssueTypeOverrideSerializer create(BoardProjectIssueTypeOverrideConfig ptConfig, BoardProjectConfig projectConfig, ParallelTaskOptions parallelTaskOptions) {
        return new BoardProjectIssueTypeOverrideSerializer(ptConfig, projectConfig, parallelTaskOptions);
    }

    ModelNode serialize() {
        ModelNode modelNode = new ModelNode();
        overrideConfig.iterateStateLinkOverrides(new Consumer<StateLinksConfigOverride>() {
            @Override
            public void accept(StateLinksConfigOverride stateLinksConfigOverride) {
                ModelNode override = stateLinksConfigOverride.createEmptyNodeWithIssueTypesList();
                override.get(OVERRIDE).set(stateLinksConfigOverride.getStateMapper().serializeModelNodeForBoard());
                modelNode.get(STATE_LINKS).add(override);
            }
        });

        // We serialize the parallel tasks per issue type, as the options may be different per issue type
        overrideConfig.iterateParallelTaskOverrides(new BiConsumer<String, ProjectParallelTaskGroupsConfig>() {
            @Override
            public void accept(String type, ProjectParallelTaskGroupsConfig projectParallelTaskGroupsConfig) {
                ModelNode override = new ModelNode();
                override.get(TYPE).set(type);

                // Use the 'advanced' accessor here as projectConfig.getParallelTaskGroupsConfig(type) returns
                // null if ProjectParallelTaskGroupsConfig.NO_CONFIG is
                ProjectParallelTaskGroupsConfig config =
                        projectConfig.getInternalAdvanced().getIssueTypeParallelTaskGroupsOverrides().get(type);

                if (config == ProjectParallelTaskGroupsConfig.EMPTY_OVERRIDE) {
                    override.get(OVERRIDE).set(new ModelNode());
                } else {
                    ModelNode tasks = override.get(OVERRIDE).setEmptyList();
                    for (ProjectParallelTaskConfig group : config.getGroups()) {
                        ModelNode groupNode = new ModelNode().setEmptyList();
                        for (ParallelTaskCustomFieldConfig cfg : group.getConfigs().values()) {
                            SortedFieldOptions.ParallelTasks options = parallelTaskOptions.getInternalAdvanced().getOptionsForIssueType(type).get(cfg.getName());
                            options.serialize(groupNode);
                        }
                        tasks.add(groupNode);

                    }
                }
                modelNode.get(PARALLEL_TASKS).add(override);
            }
        });

        return modelNode;
    }}