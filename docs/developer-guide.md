---
layout: default
title: Developer Guide
---
# 1 Prerequisites
You should have read the [User Guide](user-guide.md) and the [Admin Guide](admin-guide.md) so you are aware of 
the concepts. 

To develop Overbård locally you need to set up your development environment. You will need:

* the Atlassian SDK to build the plugin, and also to debug the Java server side classes
* Yarn to download the Javascript libraries, and other tooling for working on the UI in isolation.

Since Angular 2 is used for the display logic, it is worth looking at the quickstart at 
[https://angular.io](https://angular.io).

## 1.1 Atlassian SDK

The Atlassian SDK provides the APIs used for developing the plugin. It has tools for packaging the plugin to be 
deployed in the server, and also provides a development Jira instance where you can run and debug the plugin in a 
local Jira instance.

Download the Atlassian SDK and install it as outlined on the  
[Atlassian site](https://developer.atlassian.com/docs/getting-started/set-up-the-atlassian-plugin-sdk-and-build-a-project).

Alternatively, you can use the tgz based version from on the
[Atlassian Marketplace](https://marketplace.atlassian.com/download/plugins/atlassian-plugin-sdk-tgz)
if you hit a problem on your platform. If you this, remember to adjust your `PATH` environment variable to include 
`${ATLASSIAN_SDK}/bin`. You can check proper setup by invoking the `atlas-version` command. Optionally you can modify 
.m2/settings.xml to include the local repository `${ATLASSIAN_SDK}/repository` and the online repository 
`https://maven.atlassian.com/content/groups/public`.

## 1.2 Yarn
To install Yarn, follow the installation instructions on the [Yarn site](https://yarnpkg.com). 

# 2 First time setup

Fork the [https://github.com/overbaard/overbaard](https://github.com/overbaard/overbaard) 
repository to your own GitHub account, and then clone the repository. For this guide we will use the environment 
variable `$OB_DIR` to denote the location of the Git clone. `cd` into the `$OB_DIR` and run the following command:
```
$atlas-debug 
Executing: /Applications/Atlassian/atlassian-plugin-sdk-6.2.14/apache-maven-...
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize=256M;...
[INFO] Scanning for projects...
[INFO] 
[INFO] Using the builder org.apache.maven.lifecycle.internal.builder.single...
[INFO]                                                                         
[INFO] ------------------------------------------------------------------------
[INFO] Building Overbård 1.0.0.Alpha9-SNAPSHOT
[INFO] ------------------------------------------------------------------------
```
You will now see a lot of information scroll by while your local Jira instance is started for the first time. It has 
successfully started once you see this in the log
```
[INFO] [talledLocalContainer] INFO: Server startup in 60098 ms
[INFO] [talledLocalContainer] Tomcat 8.x started on port [2990]
[INFO] jira started successfully in 111s at http://KabirMac-2.local:2990/jira
[INFO] Type Ctrl-D to shutdown gracefully
[INFO] Type Ctrl-C to exit
```

Now open your favourite browser and go to [http://localhost:2990/jira](http://localhost:2990/jira). You will now
need to set up Jira. The order of the steps to do this seem to change somewhat as time goes by but the 
concepts should remain the same.

First follow the steps to get Jira initialised. Use `admin` as the username, and `admin` as the password and click
through the stuff you need to to do. If you are forced to create a project, give it a name like `Test`. The type of
the `Test` project does not matter as we will not be using it later.

Next install evaluation licenses for both `Jira Core (Server)` and `Jira Software (Server)` as mentioned 
[here](jira-software-license.md). The steps to get a license for Jira Core are the same as for Jira Software.
You might already have been forced to create the Core license during these initial steps, if that happened don't
forget to do the Jira Software license.

Once Jira Core and Jira Software are both installed and licensed, stop the Jira server.

Now run
```
$atlas-debug -Dob.ui -Dob.ui.deps
Executing: /Applications/Atlassian/atlassian-plugin-sdk-6.2.14/apache-maven-...
Java HotSpot(TM) 64-Bit Server VM warning: ignoring option MaxPermSize=256M;...
[INFO] Scanning for projects...
[INFO] 
[INFO] Using the builder org.apache.maven.lifecycle.internal.builder.single...
[INFO]                                                                         
[INFO] ------------------------------------------------------------------------
[INFO] Building Overbård 1.0.0.Alpha9-SNAPSHOT
[INFO] ------------------------------------------------------------------------
```
The `-Dob.ui` and `-Dob.ui.deps` system properties tell the build to 
build the user interface and include it in the final plugin archive. We will disuss these in more detail later. Note
that the first time you do this it will take quite some time - your build is most likely not hanging!

Once the server has started again, go to [http://localhost:2990/jira](http://localhost:2990/jira) and log in again.
Click on the top `Boards` menu and make sure it contains an `Overbård` entry.

Now in another terminal clone the 
[https://github.com/overbaard/overbaard-jira-populator](https://github.com/overbaard/overbaard-jira-populator)
project. `cd` into the folder and run:
```
$mvn install exec:java -Dexec.mainClass="org.overbaard.jira.populator.JiraPopulatorMain"
...
[INFO] --- exec-maven-plugin:1.6.0:java (default-cli) @ overbaard-jira-populator ---
Creating projects....
====== UP
Checking if UP exists...
Project UP does not exist
Creating project UP...
Created project UP(10100)
Creating issue...
Created issue UP-1
Creating issue...
Created issue UP-2
Creating issue...
...
Linked SUP-30 to UP-30
Created projects
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 53.796 s
[INFO] Finished at: 2018-09-28T21:59:30+01:00
[INFO] Final Memory: 29M/335M
[INFO] ------------------------------------------------------------------------
```

This sets up users, three projects (`FEAT`, `SUP` and `UP`) and populates them with components, fix versions, 
labels and issues distributed across the various states so you don't have to do that yourself.

Go to [http://localhost:2990/jira/rest/api/2/field](http://localhost:2990/jira/rest/api/2/field) and 
make a note of the id of the Rank custom field ID (on a fresh install it is normally `10005`).

Go to [http://localhost:2990/jira](http://localhost:2990/jira), and in the `Boards` menu select `Overbård`. 
Once Overbård has loaded, click the hamburger icon in the top left and choose `Config`. 
Set the `Rank custom field id` on the bottom of the page, using the value you noted in the last step.

Next, enter the contents of 
[https://github.com/overbaard/overbaard/blob/master/src/setup/board.json](https://github.com/overbaard/overbaard/blob/master/src/setup/board.json)
into the `Create a new board` text area. Click on the hamburger icon in the top left again and go to `Boards`. 
Select the `Test board`, and you should see the board fully populated.

Jira seems a bit haphazard in what it calls the `Done` state in the projects we generated (in some cases it is called 
`Done`, in others `DONE`). If you see the alarm clock icon on the lower right when viewing the board, click it 
and it will tell you what the state should be. If you don't see any alarm clock icon all is well! If it needs fixing go 
back to the config page and edit the `state-links` of the `FEAT` and `SUP` projects by changing the left hand side of 
the `Done` mappings to what the state should be. Similarly edit the `Done` entry in the `states` array of the
`UP` linked project.

Your Jira instance is now all set up. To understand better what the `board.json` config we pasted in means, see the 
[Admin Guide](admin-guide.md).


The last step is to get the web layer environment set up properly. In another terminal go to the `webapp/` directory
of the Overbård checkout:
```
$cd $OB_DIR/webapp
```
Then:
```
$yarn install
...
✨  Done in 54.86s.
```
And finally:
```
$ng serve
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
                                                                                          
Date: 2018-09-28T21:20:36.736Z
Hash: b5680d064aa1deccee97
Time: 18936ms
chunk {main} main.js, main.js.map (main) 2.15 MB [initial] [rendered]
chunk {polyfills} polyfills.js, polyfills.js.map (polyfills) 325 kB [initial] [rendered]
chunk {runtime} runtime.js, runtime.js.map (runtime) 5.22 kB [entry] [rendered]
chunk {styles} styles.js, styles.js.map (styles) 77.6 kB [initial] [rendered]
chunk {vendor} vendor.js, vendor.js.map (vendor) 6.8 MB [initial] [rendered]
ℹ ｢wdm｣: Compiled successfully.
```
If you go to [http://localhost:4200](http://localhost:4200) you should see the board running using some sample data
that does not come from Jira. Note that only the top two board links will actually take you anywhere.
  

# 3 Building/running/debugging the project

Now that we have the environment set up, let's take a look how to develop on the project.

The UI can be developed separately from the plugin itself, since it is a fat client interacting with the server via 
a REST API. So when modifying the UI files, you don't need to build, package and deploy in the server. The client 
logic is written in Typescript, and the UI steps are responsible for compiling the Typescript to Javascript. So 
depending on the focus of your current task, you can either do:

* just the UI steps (if working on purely display logic)
* or both the UI steps and the Atlassian SDK steps if you are working on something involving the server. The SDK steps 
will package the jar containing the plugin.

## 3.1 Atlassian SDK 

These commands happen from the root (`$OB_DIR`) folder of the project (i.e where `pom.xml` is located). I normally use one window 
for running the server instance and another to package the project. Stopping and starting the server takes a lot of 
time.

1. Run `atlas-debug`. This builds the plugin, starts up the Jira instance, and deploys the plugin into it. 
2. Once you change something, and want to deploy it into Jira, run `atlas-package` from another terminal window. 
This builds the plugin again, and deploys it into the running Jira instance we started in the previous step.
3. Raw `atlas-debug` or `atlas-package` builds the Java files from the `$OB_DIR/src` and simply bundles any already 
built UI files into the resulting 
Overbård plugin jar. We have some system properties to do more work.
  * `-Dob.ui.deps` - this installs a copy of yarn and node so that they are usable from the maven
   plugin used to bundle the UI. If when pulling changes from git, any of the dependencies in 
   `$OB_DIR/webapp/package.json` have 
   changed, you should delete the `$OB_DIR/webapp/node-modules` folder, and run 
   `atlas-package -Dob.ui.deps to get the fresh dependencies.
  * `-Dob.ui.dev` - this runs the Angular CLI build which refreshes the web application files to be used in the 
   Overbård plugin jar. Since the Angular CLI build takes some time to do its work, by `atlas-package` on its own
   does not build and refresh the web application files. This means that you can work on server-side code without the 
   delay. If you are working on the web application files, and want to see the changes in your local Jira instance, 
   run `atlas-package -Dob.ui` to trigger the bundling and refreshing of the web application files on the Overbård
   plugin jar.
  * `-Dob.ui` - this is like `-Dob.ui` but slower as it does optimisations for building the web application
   files for a production environment. This option should be used if you ever do a proper release of Overbård.
   
## 3.2 UI

Each of the following UI steps happen from the `$OB_DIR/webapp` folder, and a separate terminal window is needed 
for each one.

1. Run `ng serve`. This builds the webapp files and serves them up at [http://localhost:4200](http://localhost:4200).
Any errors from compiling will show up in this terminal window. Your files will be 'watched' so you can leave this 
running, and any changes will be recompiled (if you start seeing strange  behaviour, restart this job).
The `$OB_DIR/webapp/src/rest/overbaard/1.0` sub-folder contains some mock data files for running without a real 
jira instance so you can see how your changes affect the layout. As you make changes and they compile, the browser 
window refreshes automatically.
2. Run `ng test` which runs the client-side test suite. The tests mainly focus on the integrity of the redux store
and the calculated view model.

