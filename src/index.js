'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util');

import { regexHighlight, RegexError } from '../src/regex-highlighter';
import ulog from 'ulog';

const log = ulog('regex');
window.log = log;

let regexInput = document.getElementById('regexInput');
let regexBackground = document.getElementById('regexBackground');
let regexForeground = document.getElementById('regexForeground');

const inputChange = (e) => {
    setTimeout(function() {
        let regexVal = regexInput.value;
        try {
            let regex = regexHighlight({ regex: '/' + regexVal + '/' });
            log.info(regex.array);
            regexBackground.innerHTML = regex.html ? regex.html : regexVal;
        }
        catch (err) {
            log.error('Regex error: ' + err);
            // console.log('Regex error: ' + err);
            regexBackground.innerHTML = regexVal;
        }
    }, 0);
};

regexInput.addEventListener('keydown', inputChange);
regexInput.addEventListener('blur', inputChange);

