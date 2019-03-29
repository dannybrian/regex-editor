'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util')

import { regexHighlight, RegexError } from '../src/regex-highlighter';

let regexInputText = document.getElementById('regexInputText');
let regexBackground = document.getElementById('regexBackground');

regexInputText.addEventListener('keydown', e => {
    let regexVal = regexInputText.value;
    if (regexVal === '') { return; }
    regexBackground.innerHTML = regexHighlight({ regex: regexVal }).html;
});

