# Development Docker File


Since the development environment is quite fiddly to set up (See the [Developer guide](https://overbaard.github.io/docs/developer-guide.html) for examples), it is provided here as a Docker image.

See the instructions later in this document how to [build the Docker image](#building-the-docker-image).

To launch it, simply run the following command from this directory:
```shell
./run-server.sh
```
In order to not have to fetch all the dependencies every time you relaunch the image, directories are mounted so that:
* Java artifacts will be stored in the `target/` folders of each Maven module under the root checkout folder as if you were running the build locally.
* Similarly, the Javascript artifacts resulting from running `yarn install` will be stored under 
* `webapp/node_modules`. Again this would be just as if you were running the build locally.
* The local maven repository inside the image, is mapped to the `maven-repo-cache/` under this directory 
* The `/source` directory, which is the location for the shell when you launch the image.

This simplifies the setup, while allowing you to work locally with your IDE, and building the code inside the Docker image.

The steps to initialise the local Jira instance are contained in the [Developer guide](https://overbaard.github.io/docs/developer-guide.html), and everything works mostly the same. Some more detailed steps

## Differences from running locally
There are a few subtle differences when running in the container from when running locally.

### Opening a new terminal
Since we need to work on the same container, when the Developer guide tells you to open a new terminal, instead
run `docker ps` to find the container resulting from calling `run-server.sh` and note its ID. Then run 
`docker exec -it <id> bash` and you will have a second terminal.

### Running the tests from the command line
From inside the container, from the `/source/webapp` directory, run `ng test --watch=false --browsers=ChromiumHeadlessDocker`. This will run the tests, and watch as you change the source code. This is useful during development as your changes get picked up. There is also an alias for this, which does the same thing and might be easier to remember `yarn test:docker-watch`.

If you want to run the tests just once, run `ng test --watch=false --browsers=ChromiumHeadlessDocker`. There is also an alias for this, which does the same thing and might be easier to remember `yarn test:docker`

You might see errors like this
```shell
    at Process.ChildProcess._handle.onexit (internal/child_process.js:268:19)
    at onErrorNT (internal/child_process.js:470:16)
    at processTicksAndRejections (internal/process/task_queues.js:84:21) {
  errno: 'ENOENT',
  code: 'ENOENT',
  syscall: 'spawn ps',
  path: 'ps',
  spawnargs: [ '-o', 'pid', '--no-headers', '--ppid', 1494 ]
```
once the tests finish. These seem to be harmless.

### Running the tests (browser)
When running the tests and you want to see the results in the browser, run `ng test` from `/source/webapp`inside the container. Then you need to connect to `http://localhost:9876` from a browser
on your local system (i.e. outside of the container). If you don't see any results, click the 'DEBUG' button
appearing in the browser.

This is useful during development, and especially useful if you need to debug errors. You can do this from the developer tools inside your browser.

# Setting up the Jira instance

The instructions are similar for all supported Jira version (currently just) Jira 9. Just replace 'jira9' with 'jirax', where 'x' is the Jira version 

## Jira 9
These instructions are kept short. See the 'First time setup' section in the [Developer guide](https://overbaard.github.io/docs/developer-guide.html) for more details.

In a terminal run
```shell
./run-server.sh
```
to start the Docker container, and once the container starts run:
```shell
# Build all the contained dependencies in the project
atlas-mvn install
# Start the Jira 9 server in debug mode with the jira9 plugin
atlas-debug -pl jira/plugin/jira9 -Dob.jira9
```
Once the server has started fully, go to http://localhost:2990/jira from your normal browser and install the evaluation licenses for Jira Core and Jira Software.

Get the ID of the container `docker ps``, and in terminal two:

```shell
docker exec -it <container id> bash
#Once container starts, run this to build the application including the UI
# -Dob.ui packages for production and is suitable for a release. But it takes
# longer time. If you just want to do this for development, you can use
# -Dob.ui.dev
atlas-package -Dob.ui.deps -Dob.ui -Dob.jira9
```

Check output in the original (./run-server.sh) terminal to make sure it deploys.

Go to http://localhost:2990/jira (refresh if necessary) and make sure that Overbård shows up in the Boards menu.

In a native (non-docker) terminal use https://github.com/overbaard/overbaard-jira-populator to populate Jira as mentioned in the dev guide. Also, do the setup of the Rank, Epic Link and Epic Name fields outlined there, and set up the board. If you can't see those fields in the output, stop Jira and start it again in the `run-server.sh` container terminal. The command to start it again is the same as before: `atlas-debug -pl jira/plugin/jira9 -Dob.jira9`

In Overbård/Boards check the board looks ok.

Exit the containers.
The resulting plugin jar should be in (local filesystem) ../jira/plugin/jira9/target

[//]: # (## Jira 9)

[//]: # (Same steps as Jira 8, but substitute jira8 with jira9, so)

[//]: # ()
[//]: # (```shell)

[//]: # (./run-server.sh)

[//]: # (```)

[//]: # (to start the Docker container, and once the container starts run:)

[//]: # (```shell)

[//]: # (atlas-mvn install)

[//]: # (atlas-debug -pl jira/plugin/jira9 -Dob.jira9)

[//]: # (```)

[//]: # ()
[//]: # (Install licenses as above)

[//]: # ()
[//]: # (In the second docker terminal:)

[//]: # (```shell)

[//]: # (atlas-package -Dob.ui.deps -Dob.ui -Dob.jira9)

[//]: # (```)

[//]: # ()
[//]: # (Populate Jira and configure Overbård as above, and check board looks ok.)

[//]: # ()
[//]: # (Exit the containers.)

[//]: # (The resulting plugin jar should be in &#40;local _filesystem_&#41; ../jira/plugin/jira9/target)

# Building the docker image
We need to build a multi-arch docker image. Install buildx as outlined in https://www.docker.com/blog/multi-arch-build-and-images-the-simple-way/

Build the image with the following command
```` shell
docker buildx build --push --platform linux/arm64,linux/amd64  --tag quay.io/overbaard/overbaard-dev-env:latest .
````
`--push` seems to push to quay.io so you might need to change the username. If you want to just try local changes,
use `--load` instead, and edit the `--platform` flag to only contain your architecture.




