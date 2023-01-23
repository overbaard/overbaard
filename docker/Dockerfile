FROM quay.io/centos/centos:stream8

COPY resources/atlassian-yum-repo /etc/yum.repos.d/artifactory.repo
COPY resources/patch-atlas-debug.sh /


# Install Java 8 and 11, and the Atlassian SDK
RUN yum install -y java-1.8.0-openjdk-devel --nodocs && \
    yum install -y java-11-openjdk-devel --nodocs && \
    yum install -y atlassian-plugin-sdk-8.2.8 && \
    # Use latest npm version at time of writing Docker file
    yum -y install npm-6.14.10 && \
    # Python is needed when doing yarn install
    yum -y install python2-2.7.18 && \
    # Make/g++ are needed when doing yarn install
    yum -y install make gcc-c++ && \
    yum -y install wget && \
    #Checks the atlas-debug for the bad line mentioned in
    # https://ecosystem.atlassian.net/browse/ATLASSDK-220
    # and adjusts it to work
    /patch-atlas-debug.sh && \
    # The Angular tests need a browser, install Chromium
    yum install -y epel-release && \
    yum install -y chromium


# The atlassian-plugin-sdk installed with yum doesn't seem to pull in the right maven version (unlike with Homebrew on
# Mac). Add it ourselves where it expects it
RUN yum -y install maven-1:3.5.4 && \
    mkdir -p /usr/apache-maven-3.5.4/bin/ && \
    ln -s /usr/bin/mvn /usr/apache-maven-3.5.4/bin/mvn && \
    # Some commands such as atlas-debug are not using the settings.xml that comes from the
    # plugin sdk, but rather use the one from maven itself, which breaks things. Copy the SDK
    # one to the maven one
    # NB! THe sdk one has the version in its path. May need updating if we renew the sdk
    mkdir -p /usr/apache-maven-3.5.4/conf/ && \
    cp /usr/share/atlassian-plugin-sdk-8.2.8/apache-maven-3.5.4/conf/settings.xml /usr/apache-maven-3.5.4/conf/settings.xml


# We are using older node and yarn versions. Install 'n' to switch node version, and specify the
# yarn version.
RUN npm install -g n && \
    #n 12.22.3 && \
    n 14.21.0 && \
    npm install -g yarn@1.22.19 && \
    # We need to point npm/node to use the python version we installed above since it registry
    # used to run some of the dependencies
    npm config set python "/usr/bin/python2.7" && \
    # Also, we need to install the angular cli so that 'ng serve' etc works when we try to develop
    yarn global add @angular/cli@9.1.15


# corepack enable
# corepack prepare yarn@3.3.0 --activate


# We need chrome for the tests to work - see the script for where this came from
# COPY --chmod=755 resources/get-chromium.sh /chrome/get-chromium.sh
# RUN /chrome/get-chromium.sh && \
#     ln -s /chrome/latest/chrome /usr/bin/chrome
# COPY --chmod=755 resources/get-chromium.sh /get-chromium.sh
# RUN /get-chromium.sh && \
#     ln -s /latest/chrome /usr/bin/chrome

EXPOSE 2990 4200 5005 8080

VOLUME /home/root/.m2/repository

VOLUME /source
WORKDIR /source
