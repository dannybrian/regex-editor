'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util');

import { regexHighlight, RegexError } from '../src/regex-highlighter';
import ulog from 'ulog';

const log = ulog('regex');
window.log = log;

log.level = log.WARN;

const unknownErrorRegex = /SyntaxError:\s+(.+)\s*$/g;
                
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

/* regexInput gets all the pointer events and triggers the rest for its 
   siblings (hovers for tooltips, focus for input). Some fun fanc-ery here 
   to simulate real editing of the regex with a textarea while still getting 
   the cursor benefits, which are really a PITA to simulate without the native
   element btw. And managing this event pass with parent/children is very
   cumbersome. */

// MouseEvent has no IE11 support, not that we care.
function passEvent (e, el) {
    //e.stopPropagation();
    // console.log(e);
    var evt = new MouseEvent(e.type, {
        bubbles: true,
        cancelable: true,
        view: window,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY
    });
    var canceled = !el.dispatchEvent(evt);
    if(canceled) {
        // A handler called preventDefault
    } else {
        // None of the handlers called preventDefault
    }
}

regexContainer.classList.remove('success');

const showError = (e) => {
    regexError.textContent = e;
};

regexForeground.addEventListener('mouseover', function(e) {
    console.log(regexForeground); // this can't work; we'd need to attach a handler to 
    // every span in the regex; there's no way to trigger :hover via custom MouseEvent..
    // :( Do we really care about tooltips for tokens? Maybe we just need clicks to 
    // highlight the crucial Aparte stuff? Or maybe I implement a single tooltip for 
    // the app and use document.elementFromPoint? But that only gives you the topmost
    // element ... drat.
    
    // this.classList.add('hover');
});
regexForeground.addEventListener('mousemove', function(e) {
});
regexForeground.addEventListener('mouseout', function(e) {
});
regexForeground.addEventListener('click', function(e) {
});

const inputChange = (e) => {
    setTimeout(function() {
        let regexVal = regexInput.value; // the raw input, which we don't change
        try {
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
            else // we've should have an error object instead
            {
                showError(regex.error['message'] + `: '${regex.error.token}'.`);
                regexContainer.classList.remove('success');
                log.debug('Regex parse error: ' + JSON.stringify(regex));
                let escapedHTMLVal = escapeHTML(regexVal);
                regexBackground.innerHTML = escapedHTMLVal;
                regexForeground.innerHTML = escapedHTMLVal;
            }
        }
        catch (err) {
            if (err) {
                regexContainer.classList.remove('success');
                log.warn('Unknown regex parse error' + err);
                // FIXME: not clear what above is causing err to not be caught here...
                // but let's try to give some feedback anyway.
                let match = unknownErrorRegex.exec(err);
                if (match != null) {
                    showError('⚠ ' + match[1]);
                }
            }
            regexBackground.innerHTML = escapeHTML(regexVal);
            regexForeground.innerHTML = escapeHTML(regexVal);
        }
    }, 0);
};

regexInput.addEventListener('input', inputChange);
regexInput.addEventListener('blur', inputChange);

