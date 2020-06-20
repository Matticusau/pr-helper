# Build documentation

Internal notes for contributors to this repository

## Build

https://help.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github

To avoid needing to package the node_modules with the action, we have used **ncc** to compile the typescript into a single js file. A build step has been added to the package.json to facilitate this.

```json
 "scripts": {
    "build": "ncc build -o lib src/index.ts",
```

So to build the javascript package file just run

```bash
npm run-script build
```

## Releasing

When time comes for a release assign a tag

```bash
git tag -a v0.1 -m "Release v0.1"
git push --follow-tags
```

## Related resources

These resources were referenced in the creation of this package.

- https://help.github.com/en/actions/creating-actions/creating-a-javascript-action
- https://developer.github.com/webhooks/event-payloads/

Additional Actions used as inspiration or that have overlapping functionality:

- https://github.com/actions/labeler
- https://github.com/srvaroa/labeler
- https://github.com/marketplace/actions/pr-merge-bot [GitHub](https://github.com/squalrus/merge-bot)
