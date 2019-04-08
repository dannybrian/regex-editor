'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util');

import { regexHighlight, RegexError } from '../src/regex-highlighter';
import ulog from 'ulog';

const log = ulog('regex');
window.log = log;
log.level = log.WARN;
                
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
const regexError = document.getElementsByClassName('regexError')[0];

regexContainer.classList.remove('success');

const showError = (e) => {
    regexError.textContent = e;
};

const inputChange = (e) => {
    setTimeout(function() {
        let regexVal = regexInput.value; // the raw input, which we don't change
        try
        {
            let regex = regexHighlight({ regex: '/' + regexVal + '/' });
            // log.trace(regex.array);
            // remember that regex.html now contains escaped regex with normal
            // HTML markup
            if (regex.success) {
                if (regex.html === undefined) {
                    log.error('Regex HTML is undefined, but saying success?');
                }
                regexContainer.classList.add('success');
                showError('');
                let escapedHTMLVal = regex.html;
                regexBackground.innerHTML = escapedHTMLVal;
                regexForeground.innerHTML = escapedHTMLVal;
            }
            else // what do we do here?
            {
                throw new RegexError ('regexHighlight threw without any information.');
            }
        }
        catch (err) {
            regexContainer.classList.remove('success');
            log.debug('Regex error caught: ' + JSON.stringify(err));
            if (err['error']) {
                if (err.error['message'] && err.error['token']) {
                    showError(err.error.message + `: '${err.error.token}'.`);
                    log.debug('Regex parse error: ' + JSON.stringify(err));
                }
            }
            else if (err['message']) 
            {
                showError(err.message);
            }
            else
            {
                log.debug('Regex error caught but no information to display.');
            }
            // use whatever is in the text area input value
            let escapedHTMLVal = escapeHTML(regexVal);
            regexBackground.innerHTML = escapedHTMLVal;
            regexForeground.innerHTML = escapedHTMLVal;
        }
    }, 0);
};

regexInput.addEventListener('input', inputChange);
regexInput.addEventListener('blur', inputChange);

