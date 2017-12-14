export enum IssueSummaryLevel {
  HEADER_ONLY,
  SHORT_SUMMARY_NO_AVATAR,
  SHORT_SUMMARY,
  FULL
}

export function toIssueSummaryLevel(i: number): IssueSummaryLevel {
  switch (i) {
    case 0:
      return IssueSummaryLevel.HEADER_ONLY;
    case 1:
      return IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR;
    case 2:
      return IssueSummaryLevel.SHORT_SUMMARY;
    case 3:
      return IssueSummaryLevel.FULL;
  }
}
