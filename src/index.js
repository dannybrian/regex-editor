'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util')

import { regexHighlight, RegexError } from '../src/regex-highlighter';

let regexInput = document.getElementById('regexInput');
let regexBackground = document.getElementById('regexBackground');
let regexForeground = document.getElementById('regexForeground');

const inputChange = (e) => {
    setTimeout(function() {
        let regexVal = regexInput.value;
        try {
            let html = regexHighlight({ regex: '/' + regexVal + '/' }).html;
            regexBackground.innerHTML = html ? html : regexVal;
        }
        catch (err) {
            console.log('Regex error: ' + err);
            regexBackground.innerHTML = regexVal;
        }
    }, 0);
};

regexInput.addEventListener('keydown', inputChange);
regexInput.addEventListener('blur', inputChange);

