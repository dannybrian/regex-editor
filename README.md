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
