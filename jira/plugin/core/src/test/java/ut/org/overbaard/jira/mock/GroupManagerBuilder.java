/*
 * Copyright 2016 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ut.org.overbaard.jira.mock;

import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;

import org.mockito.Mockito;

import com.atlassian.jira.permission.GlobalPermissionKey;
import com.atlassian.jira.security.groups.GroupManager;
import com.atlassian.jira.user.ApplicationUser;

/**
 * @author Kabir Khan
 */
public class GroupManagerBuilder {
    private final GroupManager groupManager = Mockito.mock(GroupManager.class);
    private final Callback callback;

    private GroupManagerBuilder(Callback callback) {
        this.callback = callback;
    }

    public static GroupManager getAllowsAll() {
        return new GroupManagerBuilder(ALLOWS_ALL).build();
    }

    public static GroupManager getDeniessAll() {
        return new GroupManagerBuilder(DENIES_ALL).build();
    }

    public static GroupManager getForCallback(Callback callback) {
        return new GroupManagerBuilder(callback).build();
    }

    private GroupManager build() {
        when(groupManager.isUserInGroup(any(ApplicationUser.class), any(String.class)))
                .then(invocation -> callback.hasPermission(
                        (GlobalPermissionKey) invocation.getArguments()[0],
                        (ApplicationUser) invocation.getArguments()[1]));
        return groupManager;
    }

    public interface Callback {
        boolean hasPermission(GlobalPermissionKey key, ApplicationUser user);
    }

    private static Callback ALLOWS_ALL = (key, user) -> true;
    private static Callback DENIES_ALL = (key, user) -> false;
}
