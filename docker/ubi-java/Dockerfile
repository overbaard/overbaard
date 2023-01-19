FROM registry.access.redhat.com/ubi8/ubi:8.7

COPY resources/atlassian-yum-repo /etc/yum.repos.d/artifactory.repo

RUN yum install -y java-1.8.0-openjdk-devel --nodocs && \
    yum install -y java-11-openjdk-devel --nodocs && \
    yum install -y atlassian-plugin-sdk-8.2.8 && \
    # Use older npm version
    yum -y install npm-6.14.11 && \
    # Python is needed when doing yarn install
    yum -y install python2 && \
    # Make/g++ are needed when doing yarn install
    yum -y install make gcc-c++

# We are using older node and yarn versions. Install 'n' to switch node version, and specify the
# yarn version.
RUN npm install -g n && \
    n 12.22.3 && \
    npm install -g yarn@1.17.3 && \
    # We need to point npm/node to use the python version we installed above since it registry
    # used to run some of the dependencies
    npm config set python "/usr/bin/python2.7" && \
    # Also, we need to install the angular cli so that 'ng serve' etc works when we try to develop
    yarn global add  @angular/cli@7.3.9



VOLUME /source
WORKDIR /source
