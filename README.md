# pr-helper

A [GitHub Action](https://github.com/features/actions) to help with managing PRs through automation of common tasks.

- [Official GitHub docs](https://help.github.com/en/actions)

## Inputs

Set the following inputs in the 

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

## Known issues

None
