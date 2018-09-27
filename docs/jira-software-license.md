---
layout: default
title: Getting a Jira Software License
---

The part of Jira that allows you to use the Agile features, on which Overbård is based, is part of *Jira Software*.
Jira Software is not installed on a Jira instance by default. This guide will explain how to obtain and install a
Jira Software license. 

For the URL [http://my.jira.org](http://my.jira.org) substitute the url of your Jira instance. If you are a developer
running Jira locally via the Atlassian SDK, this URL will by default be 
[http://localhost:2990/jira](http://localhost:2990/jira).

# Obtaining the license
The steps to do this seem to vary a bit depending on the version of Jira. But the flow should be something like:
* Go to [http://my.jira.org](http://my.jira.org) and log in. If you don't see a menu called `Boards` 
in the top of the browser, you will need to follow the next steps to install and/or license Jira Software.
* From the cog in the top-right corner, select `Applications`.
* Under `Jira Software`, if it says it is not installed, press the button to download and install it.
* Once installed, under `Jira Software`, if it says it is not licensed you need to license it. You need to go to 
[https://my.atlassian.com/product](https://my.atlassian.com/product) (create an account if you don't 
already have one). Then either:
  * Purchase a license, following the instructions to obtain your server id
  * Ask for an Evaluation License, following the instructions to obtain your server id. Evaluation licenses are valid
  for 30 days and are great for development.
* Copy the text of your license from [https://my.atlassian.com/product](https://my.atlassian.com/product) and paste
it into the field under `Jira Software` back in your Jira instance.
* You should be good to go! If you used an Evaluation license, you will get warnings when accessing your Jira instance
in good time before it expires. 
