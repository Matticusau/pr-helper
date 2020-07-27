# Article FrontMatter support for Jekyll or DocFX type sites

It is common within Jekyll or DocFX type blog sites to use FrontMatter to store configuration data in the document/article which helps the build system generate the required static pages. This content may track information such as the author, page title, content tags, revision date, etc.

For example:

```markdown
---
layout: single
title: New SQL Version Life Cycle tool
date: '2018-06-09T00:29:00.000+10:00'
author: Matt Lavery
tags:
- MSSQLSERVER
- Life Cycle
modified_time: '2018-06-09T00:29:22.393+10:00'
---
```

The main purpose this article will focus on is leveraging the `author` component of the FrontMatter to assign a reviewer to the pull request.

## FrontMatter vs GitHub CODEOWNERS

GitHub provides a native way of automatically assigning reviewers to Pull Requests based on the GLOB configuration in the [CODEOWNERS](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners) file. The branch protection can also be configured that requires a CODEOWNER to review the pull request. This works well for modular code repositories and some content repositories where the owners are broken up by distinct paths.

When working with Jekyll or DocFX type sites where an article is often hosted in a directory containing many articles owned by different authors/owners. It can be very challenging to maintain the CODEOWNERS file. FrontMatter works around this by providing the ability to store the author/owner in the article. This however is not automatically detected by GitHub for reviewer assignment.

To enable the assignment of a reviewer from the article FrontMatter set `enable-prreviewer-frontmatter: true` in the action workflow file.

The key which hosts the author/owner value in the FrontMatter can be configured with the `prreviewer-authorkey` setting.

### Author Friendly Name conversion to GitHub User Name

If your site stores the author/owners friendly name in the FrontMatter you can leverage the [Author/People YAML file](https://jekyllrb.com/docs/datafiles/#example-accessing-a-specific-author) to provide the lookup to convert the friendly name to the GitHub UserName. This avoids duplicating the GitHub Username on each article.

To enable this functionality set `prreviewer-githubuserfromauthorfile: true` in the action workflow file. Provide the path to your Author/People YAML file with the `prreviewer-authorfilepath` setting. See example below.

The workflow will take the `prreviewer-authorkey` from the FrontMatter and look for the element in the `prreviewer-authorfilepath` file which matches. It will then look for the `github` key on that element and use that as the GitHub UserName to assign as reviewer.

### Example Author/Owner file

The following is an example of the Jekyll or DocFX type Author/People file as explained [Author/People YAML file](https://jekyllrb.com/docs/datafiles/#example-accessing-a-specific-author).

```yml
Test Octocat:
  name             : "Test Octocat"
  github           : "octocat"
  bio              : "This is a test user who will act as an author on some demo files"
  location         : "Brisbane, Australia"
  email            : 
  links            :
```

In this case the following workflow action file settings would be used:

```yml
with:
    enable-prreviewer-frontmatter: true
    prreviewer-authorkey: 'author'
    prreviewer-githubuserfromauthorfile: true
    prreviewer-authorfilepath: '_data/authors.yaml'
```

## Supported Workflow Events

This is feature is currently supported for the following [workflow events](https://help.github.com/en/actions/reference/events-that-trigger-workflows):

- pull_request
- schedule

## Example YAML

```yml
name: PR Merge on Schedule

on:
  schedule:
    - cron: '* 1 * * *'

jobs:
  prhelper_schedule:
    runs-on: ubuntu-latest
    steps:
    - name: Run PR Helper on Schedule
      id: runprhelperonschedule
      uses: Matticusau/pr-helper@v1.1.0
      with:
        repo-token: ${{ secrets.GHACTION_PAT }}
        enable-prmerge-automation: true
        enable-prcomment-automation: false
        enable-prlabel-automation: true
        enable-prreviewer-frontmatter: true
        enable-welcomemessage: false
        prmerge-requireallchecks: true
        prmerge-requirereviewcount: 1
        prmerge-method: 'merge'
        prmerge-deletebranch: 'true'
        prmerge-deletebranch-config: ''
        prmerge-pathcheck: true
        prmerge-allowpaths: '{"any":["articles/**"]}'
        prreviewer-authorkey: 'author'
        prreviewer-githubuserfromauthorfile: true
        prreviewer-authorfilepath: '_data/authors.yaml'
        prlabel-default: 'pr-onhold'
        prlabel-ready: 'pr-ready'
        prlabel-onhold: 'pr-onhold'
        prlabel-reviewrequired: 'review-required'
        prlabel-automerge: 'auto-merge'
```
