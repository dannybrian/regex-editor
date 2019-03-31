'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util');

import { regexHighlight, RegexError } from '../src/regex-highlighter';
import ulog from 'ulog';

const log = ulog('regex');
window.log = log;

log.level = log.DEBUG;

const escapeHTML = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const regexInput = document.getElementById('regexInput');
const regexBackground = document.getElementById('regexBackground');
const regexForeground = document.getElementById('regexForeground');
const regexContainer = document.getElementsByClassName('regexContainer')[0];

regexContainer.classList.remove('success');

const inputChange = (e) => {
    setTimeout(function() {
        let regexVal = regexInput.value; // the raw input, which we don't change
        try {
            let regex = regexHighlight({ regex: '/' + regexVal + '/ugi' });
            // log.trace(regex.array);
            // remember that regex.html now contains escaped regex with normal
            // HTML markup
            if (regex.success) {
                if (regex.html === undefined) {
                    log.error('Regex HTML is undefined, but saying success?');
                }
                regexContainer.classList.add('success');
                let escapedHTMLVal = regex.html;
                regexBackground.innerHTML = escapedHTMLVal;
                regexForeground.innerHTML = escapedHTMLVal;
            }
            else // we've should have an error object instead
            {
                regexContainer.classList.remove('success');
                log.debug('Regex parse error: ' + JSON.stringify(regex));
                let escapedHTMLVal = escapeHTML(regexVal);
                regexBackground.innerHTML = escapedHTMLVal;
                regexForeground.innerHTML = escapedHTMLVal;
            }
        }
        catch (err) {
            if (err) {
                log.warn('Unknown regex parse error' + err); // FIXME: not clear what above is causing err to not be caught here...
            }
            regexBackground.innerHTML = escapeHTML(regexVal);
        }
    }, 0);
};

regexInput.addEventListener('input', inputChange);
regexInput.addEventListener('blur', inputChange);

