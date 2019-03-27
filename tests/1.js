const util = require('util')

import test from 'ava';
import { regexHighlight, RegexError } from '../regex-highlighter';

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
        // we outlaw this because we want regexHighlight to throw the 
        // errors, rather than JavaScript doing so.
    }
    catch (err)
    {
        t.truthy(err instanceof RegexError);
        t.is(err.message, 'Parameter regex must be a string');
    }
});

test('regex string parse with errors',  t => {
    // we don't throw exceptions with parse errors, wanting this information
    // to be handled and displayed by the editor.
    const regexHL = regexHighlight({ regex: '/a|b++/' });
    t.false(regexHL.success);
    t.is(regexHL['message'], 'Unexpected token');
    t.is(regexHL['token'], '+');
    t.is(regexHL['column'], '5');
    t.is(regexHL['line'], '1');
    t.is(regexHL['pattern'], '/a|b++/');
});

test('regex AST', t => {
    const regexHL = regexHighlight({ regex: '/^q(?!u)(\\w+)[a-z]{1,}(?<hello>hello)(a|bb{1,12})\\1\\b\\k<hello>$/i' });
    t.true(regexHL.success);
    
    console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));

});

test('AST chars', t => {
     const regexHL = regexHighlight({ regex: '/\\u003B\\42\\x3Bq\\u{1F680}\\ud83d\\ude80❤️/ui' });
     t.is(regexHL.array[0].string, "\\u003B");
     t.is(regexHL.array[0].kind, "unicode");
     t.is(regexHL.array[6].kind, "simple");
     t.is(regexHL.array[6].type, "Char");
     t.is(regexHL.array[6].string, "❤");
     t.is(regexHL.flags, "iu");
});

test('AST character class', t => {
     const regexHL = regexHighlight({ regex: '/qq+w.[a-z]+[^0-9]*/' });
     t.is(regexHL.array[5].string, "[a-z]");
     t.is(regexHL.array[5].type, "CharacterClass");
     t.is(regexHL.array[6].type, "Quantifier");
     t.is(regexHL.array[6].string, "+");
    
     //console.log(util.inspect(regexHL.ast, { showHidden: false, depth: null, colors: true }));
     // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
});

