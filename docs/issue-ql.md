---
layout: default
title: Issue QL Reference
---

## 1.0 Background

Issue QL is related to Jira's JQL offering some of the functionality offered by JQL. It is 'related', and not 
strictly a subset, due to to values used in expressions currently need to be formatted. It is used to:
* define more powerful filter queries than is possible using the checkboxes in the control panel. Using the checkboxes
you are not able to do queries which look for negation. Also there is an implied OR relationship between choices within
one filter type, and an AND relationship between different filter types. As an example, if you have checked the 'Bug' 
and 'Task' issue types, and the 'Blocker' priority, the effective query used to do the filtering becomes
```
(type = 'Bug' OR type = 'Story') AND priority = 'Blocker'
```
* define swimlanes via the board configuration in addition to the ones provided automatically by Overbård.

## 2.0 Reference
First we will look at expressions which are the building block of creating an IssueQL query.

### 2.1 Expressions
In essence an expression checks the value of an issue's field against a desired value. Not all fields are 
supported, the list of the currently supported fields is here:

* `assignee` - The **key** of the issue's assignee. This is **not** the name. (To find the key of an assignee, you can 
look at what appears in the querystring in the browser when checking an assignee in the `Assignee` filter list in the 
control panel).
* `component` - The component of the issue. This is the same as appears in the `Component` filter list in the control panel.
* `fixVersion` - The fixVersion of the issue. This is the same as appears in the `Fix Version` filter list in the control panel.
* `labels` - The labels of the issue. This is the same as appears in the `Label` filter list in the control panel.
* `priority` - The priority of the issue. This is the same as appears in the `Priority` filter list in the control panel.
* `project` - The project of the issue. This is the same as appears in the `Project` filter list in the control panel.
* `type` - The type of the issue. This is the same as appears in the `Issue Type` filter list in the control panel.

There are a few limitations for the values:
* the comparison is **case-sensitive**. So if your Issue QL is checking for a 
component called `Test Component`, and in the issues it appears as "Test component" they are not considered the same.
* the desired value must always be quoted. The quotes can either be single quotes or double quotes. In the examples 
below we use the double quote style only.

### 2.2 Operators
#### 2.2.1 =

```=``` checks that an issue's field equals (or contains for fields that allow more than one value) the set value. e.g:
```
labels = "My Label"
``` 
This matches all issues that have `My Label` among their labels.

```
assignee = "kabir"
``` 
The above matches all issues that have an assignee with the key `kabir`.

#### 2.2.2 !=

```!=``` checks that an issue's field does not equal (or does not contain for fields that allow more than one 
value) the set value. e.g:
```
labels != "My Label"
``` 
This matches all issues that do not have `My Label` among their labels.

```
priority != "Blocker"
``` 
The above matches all issues that do not have the `Blocker` priority.


#### 2.2.3 IN

`IN` checks that an issues field equals (or contains for fields that allow more than value) 
one of the values inside the `IN` expression, e.g.:
```
components IN ("My Component", "Front End")
```
This matches all issues that have `My Component` or `Front End` among their components.

```
priority IN ("Blocker", "Major")
```
The above matches all issues that have the either the `Blocker` or `Major` priority.

#### 2.2.4 NOT IN

`NOT IN` checks that an issues field does not equal (or contain for fields that allow more than value) 
any of the values inside the `IN` expression, e.g.:
```
components NOT IN ("My Component", "Front End")
```
This matches all issues that have  neither `My Component` nor `Front End` among their components.

```
priority NOT IN ("Blocker", "Major")
```
The above matches all issues that have do not have the the `Blocker` or `Major` priority.

#### 2.2.5 IS EMPTY
```IS EMPTY``` is used to check that an issue field has not been set. e.g:
```
labels IS EMPTY
```
This matches all issues that do not have any labels set.

```
assignee IS EMPTY
```
This matches all issues that are unassigned.

#### 2.2.6 IS NOT EMPTY
```IS NOT EMPTY``` is used to check that an issue field has been set (but we don't care what the value is). e.g:
```
components IS NOT EMPTY
```
This matches all issues that have one or more components set.

```
assignee IS NOT EMPTY
```
The above matches all issues that have been assigned to someone.

### 2.3 Combining expressions
#### 2.3.1 AND and OR 
We support the `AND` and `OR` operators to combine expressions, e.g.:
```
assignee = "kabir" AND priority = "Blocker" OR component = "Test"
```
This matches all `Blocker` issues assigned to the user with the key `kabir`, or where `Test` is one of the components (remember that OR
has a higher precedence than AND).

#### 2.3.2 Bracketed expressions
Expressions can also be combined within brackets, e.g.:
```
(assignee = "kabir" OR assignee = "khan") AND (priority IN ("Blocker", "Major"))  
```
This matches all `Blocker` and `Major` priority issues which are assigned to a user with either of the 
keys `kabir` or `khan`.

#### 2.3.3 Negating Bracketed expressions
You can negagte a bracketed expression, e.g.:
```
!(assignee = "kabir" OR assignee = "khan") AND (priority IN ("Blocker", "Major"))  
```
This matches all `Blocker` and `Major` priority issues which are not assigned to either `kabir` or `khan`.
