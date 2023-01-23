# Development Docker File

Since the development environment is quite fiddly to set up (See the [Developer guide](https://overbaard.github.io/docs/developer-guide.html) for examples), it is provided here as a Docker image.

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

The steps to initialise the local Jira instance are contained in the [Developer guide](https://overbaard.github.io/docs/developer-guide.html), and everything works mostly the same.

## Differences from running locally
There are a few subtle differences when running in the container from when running locally.

### Opening a new terminal
Since we need to work on the same container, when the Developer guide tells you to open a new terminal, instead
run `docker ps` to find the container resulting from calling `run-server.sh` and note its ID. Then run 
`docker exec -it <id> bash` and you will have a second terminal.

### Running the tests from the command line
From inside the container, from the `/source/webapp` directory, run `ng test --watch=false --browsers=ChromiumHeadlessDocker`. This will run the tests, and watch as you change the source code. This is useful during development as your changes get picked up.

If you want to run the tests just once, run `ng test --watch=false --browsers=ChromiumHeadlessDocker`.

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

