FROM registry.access.redhat.com/ubi8/ubi:8.7

COPY resources/atlassian-yum-repo /etc/yum.repos.d/artifactory.repo

RUN yum install -y java-1.8.0-openjdk-devel --nodocs && \
    yum install -y java-11-openjdk-devel --nodocs && \
    yum install -y atlassian-plugin-sdk-8.2.8

RUN yum -y install npm-6.14.11

RUN npm install -g node@12.22.3
