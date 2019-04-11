'use strict';
const regexpTree = require('../node_modules/regexp-tree/dist/regexp-tree');
const util = require('util');

import { regexHighlight, RegexError } from '../src/regex-highlighter';
import ulog from 'ulog';
const log = ulog('regex');
log.level = log.WARN;

import { LitElement, html } from 'lit-element';

class RegexEditor extends LitElement {
    static get properties() {
        return {
            parseResult: String,
            debugLevel: String,
            regexError: String,
            // note that lit-element has its own default converters for each type
            // (thus the reason for declaring a type)
            flags: {
                type: Object,
                reflect: true,
                attribute: true,
                converter: { // came up with a good pattern here
                    fromAttribute: (value, type) => { // initial load only?
                        // put this string into our object
                        let flagsobj = {};
                        value.split('').forEach(flag => { flagsobj[flag] = true; });
                        return flagsobj;
                    },
                    toAttribute: (value, type) => { this._flagsToString; }// obj in
                }
            },
            regexValue: { attribute: true, reflect: true }
        };
    }
    constructor() {
        super();
        this.parseResult = 'failure';
        this.regexValue = '';
        this.regexError = '';
        this.debugLevel = '';
        this.flags = { };
    }
    firstUpdated() {
        this.regexInputEl = this.shadowRoot.getElementById('regexInput');
        this.regexForeground = this.shadowRoot.getElementById('regexForeground');
        this.regexBackground = this.shadowRoot.getElementById('regexBackground');
        // ^^ yes we do need these to make unfortunate/constant innerHTML writes,
        // see the note at the bottom of src/regex-highlighter.js.
        this._handleInput();
    }
    _flagsToString(flags) {
        return Object.keys(flags)
            .filter(flag => flags[flag])
            .join('');
    }
    _escapeHTML(unsafe) {
        return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
    }
    _handleInput(e) {
        let regexVal = this.regexInputEl.value; // the raw input, which we don't change
        this.regexValue = regexVal; // reflected to property
        try
        {
            let flagsNoX = Object.assign({}, this.flags);
            delete flagsNoX['x'];
            // we ignore /x here to keep editable text; see /x comments in tests/1-ast.js
            // FIXME: there's a fancy way to do this with {i,u,g,m,s} but I'm too lazy
            // right now to find it.
            let regex = regexHighlight({ regex: '/' + regexVal + '/' + this._flagsToString(flagsNoX) });
            
            if (regex.success) {
                if (regex.html === undefined) {
                    log.error('Regex HTML is undefined, but saying success?');
                }
                this.parseResult = 'success';
                this.regexError = '';
                let escapedHTMLVal = regex.html;
                this.regexBackground.innerHTML = escapedHTMLVal;
                this.regexForeground.innerHTML = escapedHTMLVal;
            }
            else // what do we do here?
            {
                throw new RegexError ('regexHighlight threw without any information.');
            }
        }
        catch (err) {
            this.parseResult = 'failure';
            log.debug('Regex error caught: ' + JSON.stringify(err));
            if (err['error']) {
                if (err.error['message'] && err.error['token']) {
                    this.regexError = '⚠ '+ err.error.message + `: '${err.error.token}'.`;
                    log.debug('Regex parse error: ' + JSON.stringify(err));
                }
            }
            else if (err['message']) 
            {
                this.regexError = err.message;
            }
            else
            {
                log.debug('Regex error caught but no information to display.');
            }
            // use whatever is in the text area input value
            let escapedHTMLVal = this._escapeHTML(regexVal);
            
            // highlight the error #7, harder than I expected
            /*
            escapedHTMLVal = escapedHTMLVal.slice(0, err.error['column']) +
                            `<span class="Error">` +
                            escapedHTMLVal.slice(err.error['column'], 1) +
                            `</span>` +
                            escapedHTMLVal.slice(err.error['column'] + 1);
            console.log(escapedHTMLVal);
            console.log(err.error['column']);
            */
            this.regexBackground.innerHTML = escapedHTMLVal;
            this.regexForeground.innerHTML = escapedHTMLVal;
        }
    }
    _flagChanged(e) {
        // gotta assign the top object, not key/values, to get reflection
        this.flags = Object.assign({}, this.flags, {[e.target.id]: e.target.checked});
        this._handleInput();
    }
    _mouseDown(e) {
        // the reason I'm using clicks for this is so I can keep 
        let els = this._elsFromPoint(e.clientX, e.clientY);
        console.log(els);
    }
    _elsFromPoint(x, y) {
        // I really hope to not need this function very often :) It's only because
        // of the wonkiness needed to keep the <textarea>; note that other online
        // regex editors simulate a cursor instead.
    
        let el, stack = [];
        while (el = this.shadowRoot.elementFromPoint(x, y)) {
            // omg this works?! ^^
            stack.push(el);
            el.classList.add('noPointer'); // using a class preserves what was there when
            // we remove it below..
            // wonder how expensive this is ^^, but it's happening between render
            // ticks, right? So not much
            if (el.tagName === 'REGEX-EDITOR' || el.tagName === 'HTML') { break; }
        }
        // clean up
        for(var i  = 0; i < stack.length; i += 1)
            stack[i].classList.remove('noPointer');

        return stack;
    }
    render(){
        // FIXME: instead of loading CSS here, use static styles etc.
        // https://lit-element.polymer-project.org/guide/styles
        // NOTE: this HTML can easily be used outside of Polymer/lit-element
        // in an HTML file and converting the JS to vanilla JS. I'm mindful
        // of the rapid changes still occuring with Polymer.
        return html`
          <link rel="stylesheet" href="regex-editor-bundle.css">
          <div id="regexTopContainer">
            <div id="regexPrefix">/</div>
            <div id="regexSuffix">/</div>
            <div id="regexFlags">
                <div class="left">
                    <div>
                        <input type="checkbox" id="i" name="i" ?checked="${this.flags.i}" @change="${this._flagChanged}">
                        <label for="i"><span class="flag-label">i</span>nsensitive</label>
                    </div>
                    <div>
                        <input type="checkbox" id="x" name="x" ?checked="${this.flags.x}" @change="${this._flagChanged}">
                        <label for="x">e<span class="flag-label">x</span>tended</label>
                    </div>
                    <div>
                        <input type="checkbox" id="m" name="m" ?checked="${this.flags.m}" @change="${this._flagChanged}">
                        <label for="m"><span class="flag-label">m</span>ultiline ^$</label>
                    </div>
                </div>
                <div class="right">
                    <div>
                        <input type="checkbox" id="g" name="g" ?checked="${this.flags.g}" @change="${this._flagChanged}">
                        <label for="g"><span class="flag-label">g</span>lobal</label>
                    </div>
                    
                    <div>
                        <input type="checkbox" id="u" name="u" ?checked="${this.flags.u}" @change="${this._flagChanged}">
                        <label for="u"><span class="flag-label">u</span>nicode</label>
                    </div>
                    <div>
                        <input type="checkbox" id="s" name="s" ?checked="${this.flags.s}" @change="${this._flagChanged}">
                        <label for="s"><span class="flag-label">s</span>ingle line</label>
                    </div>
                </div>
            </div>
            <div id="regexContainer" class="${this.parseResult}">
                <div id="regexBackground"></div>
                <div id="regexInputContainer">
                    <textarea id="regexInput" @input="${this._handleInput}"  @mousedown="${this._mouseDown}" wrap="hard" placeholder="regex goes here" autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" scrolling="no">${this.regexValue}</textarea>
                </div>
                <div id="regexForeground"></div>
            </div>
            <div id="regexError">${this.regexError}</div>
          </div>
        `;
        
        // why did we have @blur="${this._handleInput}" on textarea above? don't recall

        // ANOTHER NOTE: There's a lot of custom stuff going on with the events
        // trigged by <textarea>, including rewriting of its value on errors etc.
    }
}

customElements.define('regex-editor', RegexEditor);

