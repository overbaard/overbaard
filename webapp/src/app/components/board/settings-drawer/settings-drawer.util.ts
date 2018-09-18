import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES
} from '../../../model/board/user/board-filter/board-filter.constants';
import {Set} from 'immutable';
import {BoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';

export function getNonParallelTaskSet(filters: BoardFilterState, entry: FilterAttributes): Set<string> {
  switch (entry) {
  case PROJECT_ATTRIBUTES:
      return filters.project;
  case ISSUE_TYPE_ATTRIBUTES:
      return filters.issueType;
  case PRIORITY_ATTRIBUTES:
      return filters.priority;
  case ASSIGNEE_ATTRIBUTES:
      return filters.assignee;
  case COMPONENT_ATTRIBUTES:
      return filters.component;
  case LABEL_ATTRIBUTES:
      return filters.label;
  case FIX_VERSION_ATTRIBUTES:
      return filters.fixVersion;
  }
  if (entry.customField) {
    return filters.customField.get(entry.key);
  }
  return null;
}
