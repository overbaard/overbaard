#! /bin/bash

#Checks the atlas-debug for the bad line mentioned in
# https://ecosystem.atlassian.net/browse/ATLASSDK-220
# and adjusts it to work

ATLAS_DEBUG="$(which atlas-debug)"

CHECK_LINE=$(grep "^MVN_COMMAND=" "${ATLAS_DEBUG}")

if [ $? -eq 0 ]; then
  # Check if it is broken
  echo "${CHECK_LINE}" > tmp.txt
  grep -q "\${MVN_PLUGIN}" tmp.txt
  if [ $? -eq 0 ]; then
    MVN_PLUGIN="jira-maven-plugin"
    NEW_LINE=$(echo ${CHECK_LINE} | sed -e "s/\${MVN_PLUGIN}/jira-maven-plugin/g")
    sed -i "s/${CHECK_LINE}/${NEW_LINE}/" "${ATLAS_DEBUG}"
    unset MVN_PLUGIN
  fi
  rm tmp.txt
fi
