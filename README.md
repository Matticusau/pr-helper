# pr-helper

A [GitHub Action](https://github.com/features/actions) to help with managing PRs through automation of common tasks.

- [Official GitHub docs](https://help.github.com/en/actions)

## Inputs

Set the following inputs in the workflow file

### `configuration-path`

**Required** The path to the configuration file e.g. `.github/prhelper.yml`.

### `repo-token`

**Required** The token to use for github authentication. Recommend using `${{ secrets.GITHUB_TOKEN }}`. If additional access is required use a PAT and set it as a secret. More info see [here](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)

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
      uses: Matticusau/pr-helper@v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        configuration-path: '.github/prhelper.yml'
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

## Configuration file

The following yaml can be used to configure the Action's configuration file. The default path is `.github/prhelper.yml`, which can be overridden through the workflow config file. A sample of this file is also contained in this repo.

```yml
welcomemessage:
  check: false
  message: "Thanks for opening an issue! Make sure you've followed CONTRIBUTING.md.\n\nWhen you are ready mark the PR ready by commenting `#pr-ready`. If you still have work to do comment with `pr-onhold`."
prcomments:
  check: false
  prreadylabel: pr-ready
  onholdlabel: pr-onhold
prmerge:
  check: false
  labels:
    initiallabel : pr-onhold
    automergelabel : auto-merge
    readytomergelabel : pr-ready
    reviewrequiredlabel : review-required
  mergemethod: merge
```

## Troubleshooting

If you are having issues running the action enable the debug logs as some additional logging has been built into the Action.

1. To enable runner diagnostic logging, set the following secret in the repository that contains the workflow: `ACTIONS_RUNNER_DEBUG` to `true`.
1. To download runner diagnostic logs, download the log archive of the workflow run. The runner diagnostic logs are contained in the `runner-diagnostic-logs` folder. For more information on downloading logs, see [Downloading logs](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#downloading-logs).

[Enable debug logging](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#enabling-debug-logging)

## Known issues

None
