# How to contribute 🏗

## Rules
- **Rule #1**: Keep it as simple as possible!  
- **Rule #2**: Really, keep it simple...  

## Discussions and agreement
Before you start working on something, please make sure we have thoroughly discussed it in the corresponding issue thread and we have agreed on an implementation. Also check if there is not already a PR where someone else is working on the same problem.

## Basic development flow
1. Clone the repo:
```sh
$ git clone git@github.com:rdlf0/minesweeper.git
```
2. Create a new feature branch with good descriptive name:
```sh
$ git checkout master
$ git pull
$ git checkout -b super-cool-feature
$ git push -u origin super-cool-feature
```
3. Implement the feature/bug fix
4. Commit your changes:
```sh
$ git commit -am "Something descriptive but concise about the changes I made"
```
5. Push to the branch:
```sh
$ git push
```
6. Repeat 3-5 as needed
7. Test your changes locally
8. Create a new pull request - assign it to yourself, add some appropriate tags and link it to the corresponding issue
