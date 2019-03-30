# Regex Highlighter

~~~~
import { regexHighlight, RegexError } from '../regex-highlighter'; // needs -r esm under node

const regexHL = regexHighlight({ regex: '/a|b++/gi' }); // simple JS object
regexHL.flags; // STRING of any flags passed to regex engine, alphabetized
regexHL.html; // HTML markup for regex just <span> tags with classes
regexHL.array; // a specialized list of tokens for generating the HTML
~~~~
  
## Install Dependencies

`% npm install`

## Run Tests

`% npm test`

## Build for Browser

`% npm run build`

## As a Model for Further Development

Being the first code I've written for Aparte, I've tried to establish some best 
practices for further development. This README is not a good example of those 
practices. :-)

### File Structure

* `src/` - the source code, with `index.js` as an entry point and other modules named sanely. The `index.js` (or `web.js`) file is generally the entry point for a web build. See the `package.json` below.
* `tests/` - unit tests written with Ava.
* `web/` - deployable web implementations, with only UI-necessary logic.
* `experiments/` - non-production code to demonstrate or test ideas.
* `dist/` - bundled or built versions of the code in `src/`, generally not committed to git.

### Node and Browser Capable

Most JavaScript created for the project should run on both Node and modern 
browsers.

### Preprocessors and Builds

I swear by LESS as a CSS preprocessor `(web/*.less)`, Browserify for `require()` compatibility, Butternut/squash for minification, the ESM module for making Node ES6-capable (forget `--experimental-modules`), and ESMify for adding ES6 import/export properly to Browserify builds. Many of these decisions are based on the fact that everything I'm writing is as an ES6 module. This doesn't mean everything is an ES6 class! To the contrary.

### ES6 Modules

Use `export` as a function keyword to keep this all sane. I personally think the `default` is overrated.

~~~~
export const regexHighlight = ({ DEFAULTS }) => { }
~~~~

~~~~
import { regexHighlight } from '../src/regex-highlighter';
~~~~

### Errors

Throw errors and add tests to test for them.

~~~~
export class RegexError extends Error {}

throw new RegexError ('Invalid regular expression, unknown error: ' + err);
~~~~

~~~~
try { false; }
catch (err)
{
    t.truthy(err instanceof RegexError);
    t.is(err.message, 'Invalid regular expression...');
}
~~~~

However, when you want to handle this more concisely, and especially to make data available to the UI, you don't necessarily need to throw.

~~~~
catch (err)
{
    let matches = errorRegex.exec(err);
    if (matches && matches.length > 0) {
        return { success: false, error: { message: matches[2], pattern: matches[1],
          token: matches[3], line: matches[4], column: matches[5] } };
    }
~~~~

As a rule, return data structures, `try/catch/finally` where you need to intercept throws, and throw your own custom errors where you don't anticipate much processing of the exception.

### Developing

I run the `ws` web server (Node's) in `web/`, but any ol' web server will do.

Continuous watch/build tools like watchify are not pipe/redirection friendly, and I spent plenty of time trying. Watchman is a better tool IMO, and works for any use case. So run:

~~~~
% watchman watch-del-all
% watchman -- trigger src/ jsfiles '*.js' -- npm run build-js
% watchman -- trigger web/ webfiles '*.less' -- npm run build-css
% watchman shutdown-server # when done
~~~~

Although this requires more overhead than constantly running Node watchers, it allows the processes to exit status properly for piping, which I like more. And it doesn't require additional JavaScript build scripts or error handlers. The above pipe to a notification on errors.

Run the `npm run build-js` or `build-css` scripts to get the details. There is logging capacity via watchman but I haven't bothered to figure it out.

### Logging

I'm using [ulog](https://github.com/Download/ulog).

### package.json
