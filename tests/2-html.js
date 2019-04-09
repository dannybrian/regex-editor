const util = require('util');
import { parse } from 'node-html-parser';
import test from 'ava';
import { regexHighlight, RegexError } from '../src/regex-highlighter';

const escapeRegExp = (string) => {
    return String.raw`${string}`.replace(/\\/, '\\\\', 'g');
};

test('import', t => {
    t.truthy(regexHighlight);
});

test('well-formed HTML', t => {
    const regex = '/' + escapeRegExp('[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,4}') + '/';
    const regexHL = regexHighlight({ regex: regex });
    t.true(regexHL.success);
    let root = parse(regexHL.html);
    t.truthy(root);
});

test('token categorizations', t => {
    // FIXME: unicode escapes don't work well here, at least not the \x{0000} style
    const regex = ('/^(a|b)\\/+(?<V>hi\b)(?=ab|cde)\\1\k<V>.\u0000([a-z0-9]*?|bb{1,12})$/u');
    const regexHL = regexHighlight({ regex: regex });
    t.true(regexHL.success);
    let root = parse(regexHL.html);
    t.truthy(root);
    t.is(root.querySelectorAll('.Char').length, 23); // actually 36, but 23 shallow search
    // NOTE: this doesn't do a deep query, so it will not match what you get
    // from a browser's document.querySelectorAll; I'm only using it here as a
    // quick test case...
    t.is(root.querySelectorAll('.Backreference').length, 1); // actually 2, but 1 shallow
    // So these querySelector tests are pretty brittle.
    
    // console.log(util.inspect(regexHL.ast, { showHidden: false, depth: null, colors: true }));
});

/* This won't work; our parser will see the dual code points. Regexr doesn't get this 
   right, either; regex101.com does. But matching individual emojis doesn't seem that 
   useful to our engine anyway.
   
test('unescaped emojis', t => {
    const regexHL = regexHighlight({ regex: '/❤️👩\\u{1F469}/u' });
    console.log(util.inspect(regexHL.ast, { showHidden: false, depth: null, colors: true }));
});
*/

