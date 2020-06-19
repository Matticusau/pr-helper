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

## Related resources

These resources were referenced in the creation of this package.

- https://help.github.com/en/actions/creating-actions/creating-a-javascript-action
- https://developer.github.com/webhooks/event-payloads/
