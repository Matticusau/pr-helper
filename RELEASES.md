# Releases

## v1.0.0

Releasing the following functionality:

- Documentation improvements

Breaking Changes:

- The configuration parameter `enable-prmerge-allowpaths` was renamed to `prmerge-allowpaths`

## v1.0.0

Releasing the following functionality:

- Delete branch on merge #14
- Docs on Auto merge filters #15
- Auto Merge Filter feature #18
- Assign reviewers from YAML front matter (e.g. jekyll) #19

Bug fixes:

- Auto merge should not proceed if approved reviews greater than minimum required but requested changes exist #16
- Multiple comment automation welcome messages #17

## v0.1

Initial release providing the following functionality:

- Welcome message on new PR
- Automatic Label assignment and removal
  - Based on Review criteria (required/provided)
  - If PRs qualify for automatic merge (___in preview___)
- Welcome message on new PR
- PR Comment automation
  - Welcome message with instructions on new PRs
  - Assign a label indicating if the PR is ready or on hold based on key words
- Pull Request Merge
  - Automatically merge when criteria is met
  - Respect requested reviews (_i.e. CODEOWNERS_)
  - Respect a minimal review count (_for now configured by input param, repo setting on roadmap_)

