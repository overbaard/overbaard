FROM registry.access.redhat.com/ubi8/ubi:8.7

COPY resources/atlassian-yum-repo /etc/yum.repos.d/artifactory.repo
COPY resources/patch-atlas-debug.sh /


# Install Java 8 and 11, and the Atlassian SDK
RUN yum install -y java-1.8.0-openjdk-devel --nodocs && \
    yum install -y java-11-openjdk-devel --nodocs && \
    yum install -y atlassian-plugin-sdk-8.2.8 && \
    # Use older npm version
    yum -y install npm-6.14.11 && \
    # Python is needed when doing yarn install
    yum -y install python2 && \
    # Make/g++ are needed when doing yarn install
    yum -y install make gcc-c++ && \
    yum -y install wget

RUN /patch-atlas-debug.sh

# We are using older node and yarn versions. Install 'n' to switch node version, and specify the
# yarn version.
RUN npm install -g n && \
    n 12.22.3 && \
    npm install -g yarn@1.17.3 && \
    # We need to point npm/node to use the python version we installed above since it registry
    # used to run some of the dependencies
    npm config set python "/usr/bin/python2.7" && \
    # Also, we need to install the angular cli so that 'ng serve' etc works when we try to develop
    yarn global add @angular/cli@7.3.9

# We need chrome for the tests to work - see the script for where this came from
# COPY --chmod=755 resources/get-chromium.sh /chrome/get-chromium.sh
# RUN /chrome/get-chromium.sh && \
#     ln -s /chrome/latest/chrome /usr/bin/chrome
# COPY --chmod=755 resources/get-chromium.sh /get-chromium.sh
# RUN /get-chromium.sh && \
#     ln -s /latest/chrome /usr/bin/chrome

EXPOSE 2990 4200 5005

VOLUME /home/root/.m2/repository

VOLUME /source
WORKDIR /source
