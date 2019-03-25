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

test('regex parse with errors',  t => {
    try {
        const regexText = regexHighlight({ regex: '/a|b++/' });
        // FIXME: this will behave differently if passed as a RegExp object 
        // (without the quotes)
    }
    catch (err) {
        // console.log(err);
        t.is(err['text'], 'Unexpected token in regex parse');
        t.is(err['token'], '+');
        t.is(err['column'], '5');
        t.is(err['line'], '1');
        t.is(err['pattern'], '/a|b++/');
    }
});
