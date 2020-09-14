[![License](https://img.shields.io/github/license/Matticusau/pr-helper.svg?style=flat-square)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/Matticusau/pr-helper.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/commits)
[![Latest tag](https://img.shields.io/github/tag/Matticusau/pr-helper.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/releases)
[![Issues](https://img.shields.io/github/issues/Matticusau/pr-helper.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/Matticusau/pr-helper.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/pulls)

# pr-helper

Extremely powerful [GitHub Action](https://github.com/features/actions) to streamline management of PRs through automation of common tasks. Very versatile with plenty of configuration settings to adapt to many different implementations.

Currently supports the following functionality:

- Welcome message on new PR
- Automatic Label assignment and removal
  - Based on Review criteria (required/provided)
  - If PRs qualify for automatic merge
- PR Comment automation
  - Welcome message with instructions on new PRs
  - Assign a label indicating if the PR is ready or on hold based on key words
- Pull Request Reviewers
  - Automatically assign reviewers from YAML front matter
  - Name matching to github username via Jekyll or DocFX Author/People YAML file. More details [here](./docs/FrontMatter.md).
- Pull Request Merge
  - Automatically merge when criteria is met
  - Respect requested reviews (_i.e. CODEOWNERS_)
  - Respect a minimal review count (_for now configured by input param, repo setting on roadmap_)
  - Delete branch (head ref) on merge

## Events

The Action can respond to the following [workflow events](https://help.github.com/en/actions/reference/events-that-trigger-workflows):

- pull_request
- pull_request_review
- issue_comment
- schedule

## Inputs

Set the following inputs in the workflow file

### `repo-token`

**Required** The token to use for github authentication. Recommend using `${{ secrets.GITHUB_TOKEN }}`. If additional access is required use a PAT/Secret and set it as a secret. More info see [here](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token).

> If you have enabled Branch Protection rules then a PAT/Secret will need to be configured.

### `enable-prmerge-automation`

**Required** Set to true to enable the auto merge capabilities

### `enable-prcomment-automation`

**Required** Set to true to enable the PR/Issue comment automation

### `enable-prlabel-automation`

**Required** Set to true to enable the PR label automation

### `enable-prreviewer-frontmatter`

Set to true to enable reviewers to be set from owner in YAML front matter.

### `enable-welcomemessage`

**Required** Set to true to automatically send a welcome message to new contributors

### `welcome-message`

The custom welcome message to send to new contributors

Requires `enable-welcomemessage: true`

### `prmerge-requireallchecks`

Set to true if all checks need to complete before auto merging

### `prmerge-requirereviewcount`

Should match the setting in your GitHub repo. Set it to -1 to disable.

### `prmerge-method`

The method to use when merging the PRs

### `prmerge-pathcheck`

Set to true to require a path check for auto merge capabilities

Requires `enable-prmerge-automation: true`

### `prmerge-allowpaths`

Provide the path globs which will allow auto merge. JSON object as string, example format {"any":["docs/**"]}.

Requires `prmerge-pathcheck: true`

### `prmerge-deletebranch`

If true then the branch will be deleted on merge

Requires `enable-prmerge-automation: true`

### `prmerge-deletebranch-config`

Provide the branch patterns which will allow/deny auto delete on merge. JSON object as string, example format {"deny":["dev"]}.

Requires `prmerge-deletebranch: true`

### `prreviewer-authorkey`

The key in the YAML front matter to define the article author(s), who will be assigned as reviewers. Defaults to `author`

```yml
---
title: My great article
author: octocat
---
```

Requires `enable-prreviewer-frontmatter: true`

### `prreviewer-githubuserfromauthorfile`

When set to `true` enables the lookup of the author from the Jekyll style Author YAML file

Requires `enable-prreviewer-frontmatter: true`

### `prreviewer-authorfilepath`

Provides the ability to configure the path to the Jekyll authors YAML file to use in lookup. Default is `docs/_data/authors.yml`

Requires `enable-prreviewer-frontmatter: true` and `prreviewer-githubuserfromauthorfile: true`

### `prlabel-default`

The initial label to set on PRs when first created

### `prlabel-ready`

The label to use when the PR has been signed off and ready for merge

### `prlabel-onhold`

The label to use when the PR is on hold

### `prlabel-reviewrequired`

The label to use when the PR requires reviews

### `prlabel-automerge`

The label to set on PRs when it qualifies for automatic merge by this action

## Outputs

None

## Example usage

Create the following file within your repo as `.github/workflows/pullrequest.yml` to configure an action.

```yml
name: PR Helper

on: [pull_request, pull_request_review, issue_comment]

jobs:
  prhelper_job:
    runs-on: ubuntu-latest
    steps:
    - name: Run PR Helper
      id: runprhelper
      uses: Matticusau/pr-helper@v1.2.3
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

> Note: The `uses` syntax includes tag/branch specification. For the latest release see [tags](https://github.com/Matticusau/pr-helper/tags).

To restrict the branches that this workflow executes on use this syntax

```yml
name: PR Helper

on:
  pull_request:
    branches:
      - master
  pull_request_review:
    branches:
      - master
  issue_comment:
    branches:
      - master
jobs:
  ...
```

## Example inputs

The action can be customized using the additional inputs on the workflow yaml file. This will always be read from the default branch of the repository, rather than custom yaml config files which can be overridden as they are read in the branch where the workflow is triggered from.

```yml
with:
  repo-token: ${{ secrets.GITHUB_TOKEN }}
  enable-prmerge-automation: true
  enable-prcomment-automation: true
  enable-prlabel-automation: true
  enable-prreviewer-frontmatter: false
  enable-welcomemessage: true
  welcome-message: "Thanks for opening an issue! Make sure you've followed CONTRIBUTING.md."
  prmerge-requireallchecks: true
  prmerge-requirereviewcount: 1
  prmerge-method: 'merge'
  prlabel-default: 'pr-onhold'
  prlabel-ready: 'pr-ready'
  prlabel-onhold: 'pr-onhold'
  prlabel-reviewrequired: 'review-required'
  prlabel-automerge: 'auto-merge'
```

## Suggested Label Colors

Labels will be created during the assignment if they do not exist. The following are suggested labels and colors:

| Label | Description | Color |
| --- | --- | --- |
| pr-onhold | Pull Request is not yet ready to process automatically or review | #b60205 (red) |
| review-required | Pull Request or Issue requires review | #fbca04 (yellow) |
| qualifies-auto-merge | Pull Request qualifies for automatic merge | #0e8a16 (green) |
| pr-ready | Pull Request is ready to process or review | #0e8a16 (green) |

## Troubleshooting

If you are having issues running the action enable the debug logs as some additional logging has been built into the Action.

1. To enable runner diagnostic logging, set the following secret in the repository that contains the workflow: `ACTIONS_RUNNER_DEBUG` to `true`.
1. To download runner diagnostic logs, download the log archive of the workflow run. The runner diagnostic logs are contained in the `runner-diagnostic-logs` folder. For more information on downloading logs, see [Downloading logs](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#downloading-logs).

[Enable debug logging](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#enabling-debug-logging)

## Known issues

### PRs from Forked private repo [#24](https://github.com/Matticusau/pr-helper/issues/24)

From [https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull-request-events-for-forked-repositories](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull-request-events-for-forked-repositories)

> Note: Workflows do not run on private base repositories when you open a pull request from a forked repository.

To work around this use the schedule event. This action supports the schedule event for Label, Review, and Merge features. Currently the Welcome message functionality is only supported for pull_request events.

Example YAML for running the action every day at 1am.

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
      uses: Matticusau/pr-helper@v1.2.3
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

### Multiple files and CODEOWNERS will block auto merge [#27](https://github.com/Matticusau/pr-helper/issues/27)

When using the CODEOWNERS feature and multiple files with different CODEOWNERS are modified. Even though you meet the minimum number of reviewers if there is still pending reviews from CODEOWNERS for files with no review yet, then this will block the merge and may throw an error on the action workflow.
