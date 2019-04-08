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
            regexValue: { attribute: true, reflect: true }
        };
    }
    constructor() {
        super();
        this.parseResult = 'failure';
        this.regexValue = 'a|b';
        this.regexError = '';
        this.debugLevel = '';
    }
    firstUpdated() {
        this.regexInputEl = this.shadowRoot.getElementById('regexInput');
        this.regexForeground = this.shadowRoot.getElementById('regexForeground');
        this.regexBackground = this.shadowRoot.getElementById('regexBackground');
        // ^^ yes we do need these to make unfortunate/constant innerHTML writes,
        // see the note at the bottom of src/regex-highlighter.js.
        this._handleInput();
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
            let regex = regexHighlight({ regex: '/' + regexVal + '/' });
            // log.trace(regex.array);
            // remember that regex.html now contains escaped regex with normal
            // HTML markup
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
            this.regexBackground.innerHTML = escapedHTMLVal;
            this.regexForeground.innerHTML = escapedHTMLVal;
        }
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
            <div id="regexContainer" class="${this.parseResult}">
                <div id="regexBackground"></div>
                <div id="regexInputContainer">
                    <textarea id="regexInput" @input="${this._handleInput}" @blur="${this._handleInput}" wrap="hard" placeholder="regex goes here" autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" scrolling="no">${this.regexValue}</textarea>
                </div>
                <div id="regexForeground"></div>
            </div>
            <div id="regexError">${this.regexError}</div>
          </div>
        `;
        // ANOTHER NOTE: There's a lot of custom stuff going on with the events
        // trigged by <textarea>, including rewriting of its value on errors etc.
    }
}

customElements.define('regex-editor', RegexEditor);
