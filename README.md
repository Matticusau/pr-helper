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

## Known issues

None
