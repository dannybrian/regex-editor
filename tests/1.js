import test from 'ava';
import regexHighlight from '../regex-highlighter';

test('import', t => {
  t.truthy(regexHighlight);
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});


test('regex parse',  t => {
   const regexText = regexHighlight({ regex: '/a|b+/' });
   t.truthy(regexText);
});

test('passing RegExp object', t => {
    try {
        const regexText = regexHighlight({ regex: /a|b+/ });
        // we outlaw this because we want regexHighlight to throw the 
        // errors, rather than JavaScript doing so.
    }
    catch (err) {
        t.is(err['message'], 'Parameter regex must be a string');
    }
});

test('regex string parse with errors',  t => {
    try {
        const regexText = regexHighlight({ regex: '/a|b++/' });
    }
    catch (err) {
        t.is(err['message'], 'Unexpected token');
        t.is(err['token'], '+');
        t.is(err['column'], '5');
        t.is(err['line'], '1');
        t.is(err['pattern'], '/a|b++/');
    }
});

//var regex1 = '/q(?!u)(\w+)[a-z]{1,}(?<hello>{{hello}})/i';
