const util = require('util')

import test from 'ava';
import { regexHighlight, RegexError } from '../src/regex-highlighter';

test('import', t => {
  t.truthy(regexHighlight);
});

/*
test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});
*/


test('regex parse',  t => {
   const regexHL = regexHighlight({ regex: '/a|b+/' });
   t.truthy(regexHL);
});

test('passing RegExp object', t => {
    try {
        const regexHL = regexHighlight({ regex: /a|b+/ });
        // we outlaw (non-string regex) this because we want regexHighlight to throw the 
        // errors, rather than the JavaScript parser doing so.
    }
    catch (err)
    {
        t.truthy(err instanceof RegexError);
        t.is(err.message, 'Parameter regex must be a string');
    }
});

test('regex string parse with errors',  t => {
    /* we always throw errors from the regexHighlight, this one just 
       contains a lot more information */
    try 
    {
        const regexHL = regexHighlight({ regex: '/a|b++/' });
    }
    catch (err)
    {
        t.false(err.success);  
        t.is(err.error['message'], 'Unexpected token');
        t.is(err.error['token'], '+');
        t.is(err.error['column'], '5');
        t.is(err.error['line'], '1');
        t.is(err.error['pattern'], '/a|b++/');
    }
});

test('regex AST', t => {
    const regexHL = regexHighlight({ regex: '/^q(?!u)(\\w+)[a-z]{1,}(?<hello>hello)(a|bb{1,12})\\1\\b\\k<hello>$/i' });
    t.true(regexHL.success);
    
    // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
});

test('AST chars', t => {
    const regexHL = regexHighlight({ regex: '/\\u003B\\42\\x3Bq\\u{1F680}\\ud83d\\ude80❤️/ui' });
    // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
    t.is(regexHL.array[1].string, "\\u003B");
    t.is(regexHL.array[1].kind, "unicode");
    t.is(regexHL.array[7].kind, "simple");
    t.is(regexHL.array[7].type, "Char");
    t.is(regexHL.array[7].string, "❤");
    t.is(regexHL.flags, "iu");
});

test('AST character classes', t => {
     const regexHL = regexHighlight({ regex: '/qq+w.[a-z]+[^0-9]*/' });
     //console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
     t.true(regexHL.success);
     // t.is(regexHL.array[6].string, "[a-z]"); // we stopped adding {string}
     t.is(regexHL.array[6].type, "CharacterClass");
     t.is(regexHL.array[13].type, "Quantifier");
     t.is(regexHL.array[13].string, "+");
    
     //console.log(util.inspect(regexHL.ast, { showHidden: false, depth: null, colors: true }));
     // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
});

test('error parsing edge case', t => {
    try
    {
        const regexHL = regexHighlight({ regex: '/a|b(ac)//' });
    }
    catch (err)
    {
        t.false(err.success);
        t.is(err.error['message'], 'Unexpected token');
        t.is(err.error['token'], '/');
        t.is(err.error['column'], '9');
        t.is(err.error['line'], '1');
        t.is(err.error['pattern'], '/a|b(ac)//');
    }
});

// ^(a|b)\/+(?<V>hi\b)(?=ab|cde)\1\x{1234}\1\k<V>.([a-z0-9]*?|bb{1,12})$d