# edb-solution-validator

[![Build Status](https://travis-ci.org/Eaternity/edb-solution-validator.svg?branch=develop)](https://travis-ci.org/Eaternity/edb-solution-validator)

This is the validator used in the [eaternity-edb-solution](https://github.com/Eaternity/eaternity-edb-solution) app to validate the product tree and pull fields from parent products. It was moved here to make debugging possible because we did manage to [debug the electron main process directly](https://github.com/electron/electron/blob/master/docs/tutorial/debugging-main-process.md). When we manage to do this we should probably move it back...


### Instructions for development

To extend or fix the validator make sure to work on a separate branch e.g. `feature/xxx`, pull that branch into the [eaternity-edb-solution](https://github.com/Eaternity/eaternity-edb-solution) by adding the `#feature/xxx` tag to the import statement in `package.json` and running `npm install`. See [here](https://stackoverflow.com/questions/16350673/depend-on-a-branch-or-tag-using-a-git-url-in-a-package-json) for more info if needed.

#### For debugging against real eaternity-edb-data:

- copy the `eaternity-edb-data` folder into the root of this repo (it's gitignored and should not get published!!)
- adjust `src/debug.js` to your liking
- `npm run debug`

When finished merge the feature branch into develop. Then bump the version number and merge into master.

Finally, back in the [eaternity-edb-solution](https://github.com/Eaternity/eaternity-edb-solution) make sure to remove the `#feature/xxx` tag again to make sure the master branch get's pulled in!
