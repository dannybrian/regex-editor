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
    const regexHL = regexHighlight({ regex: String.raw`/^q(?!u)\b(\w+)[a-z]{1,}(?<hello>hello)(a|bb{1,12})\\1\b\k<hello>$/i` }); // the \\1 because otherwise it's a JS octal literal
    t.true(regexHL.success);
    
    // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
});

test('AST chars', t => {
    /* This definitely gave me some trouble, so here's a rundown:
    
        - don't forget the Unicode flag (/u) :-)
        - \u{1F680} is 🚀 , this is Unicode code point ROCKET(U+1F680)
        - JavaScript sees \ude80 as the actual charater; printing it gets the "icon".
        - Rendered HTML sees and displays \ude80 just as text.
        - &#x1F680; is the HTML entity, renders the icon, but also changes in the view 
          source DOM to the icon and won't be editable as the HTML entity. In other words
          it's the same as just adding the "icon".
        - string.codeCharAt() only sees 1 byte; see knownCodeCharAt() down below.
        - Our parser (regexp-tree) only categorizes \\uXXXX as unicode.
        - JavaScript strings like '\u{1F680}' are just operating on the code text,
          not the rendered character.
        - knownCodeCharAt('🚀',0) === 128640
        - (128640).toString(16) === "1f680" // (or 1F680)
        - in a console: $ printf 🚀 | hexdump # gives you 0000000 f0 9f 9a 80        
        - to see the icon: $ echo -e "\xf0\x9f\x9a\x80" # gives you 🚀
        - the PCRE version is \x{1F680} 
        - $ perl -Mutf8 -CS -e 'print "\x{1F680}"' # 🚀 (use utf8; isn't needed for
        - # this example, but you want it if you want Perl to see the Unicode, as 
        - # opposed to having the console interpret the multibyte output (-CS))
        - In JS code, '🚀' === '\u{1F680}'. This is probably the most important thing to 
          remember. And this is why our regex parser won't fare any better with \u then
          with the "icon", and we need \\u.
        
      So when it comes to our module, we want it to see exactly the regex pattern without
      escaping. That means only escaping what *needs* escaping for JavaScript 
      itself. HOWEVER, our parser needs \\u 🙄. It also needs \\b for a \b, because 
      remember that '\b' is actually a backspace, and '\u' is an "illegal unicode 
      sequence". I need to get it through my head that all these escapes mean different
      things to different software. :-) Putting backslashes in say, HTML attributes,
      are just backslashes unless they are in front of the closing quotes for 
      the attribute.

      Also remember that these escapes are needed by *JavaScript*, not the parser. This
      is why putting an el.getAttribute('regexValue') can go in a variable, have \u 
      instead of \\u, and work properly. It's only when we store that string *as code* 
      (as in the case with our tests) that we need to escape this stuff.
            
      The right behavior is thus to only ever escape this stuff when it's in the 
      *interpreted*, written JavaScript, and not when we're passing around variables.
      And this is what String.raw`` is for!!!
      
    */
    const regexHL = regexHighlight({ regex: String.raw`/\u003B\\42\x3Bq\u{1F680}\ud83d\ude80❤️/ui` });
    // console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
    t.true(regexHL.array[1].html.includes(String.raw`\u003B`)); // love .includes
    t.truthy(regexHL.array[1].html.match(/class=['"]\s*char\s+unicode/i)); // love .match
    t.falsy(regexHL.array[1].html.match(/\u003B/)); // because it's not actually the char
    t.truthy(regexHL.array[1].html.match(/\\u003B/u)); 
    t.is(regexHL.flags, "iu"); // these get alphasorted
});

test('AST character classes', t => {
     const regexHL = regexHighlight({ regex: String.raw`/qq+w.[a-z]+[^0-9]*/` });
     //console.log(util.inspect(regexHL.array, { showHidden: false, depth: null, colors: true }));
     t.true(regexHL.success);
     // t.is(regexHL.array[6].string, "[a-z]"); // we stopped adding {string}
     t.is(regexHL.array[6].type, "CharacterClass");
     t.is(regexHL.array[13].type, "Quantifier");
     t.is(regexHL.array[13].string, "+");
    
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



function knownCharCodeAt(str, idx) {
  str += '';
  var code,
      end = str.length;

  var surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  while ((surrogatePairs.exec(str)) != null) {
    var li = surrogatePairs.lastIndex;
    if (li - 2 < idx) {
      idx++;
    }
    else {
      break;
    }
  }

  if (idx >= end || idx < 0) {
    return NaN;
  }

  code = str.charCodeAt(idx);

  var hi, low;
  if (0xD800 <= code && code <= 0xDBFF) {
    hi = code;
    low = str.charCodeAt(idx + 1);
    // Go one further, since one of the "characters"
    // is part of a surrogate pair
    return ((hi - 0xD800) * 0x400) +
      (low - 0xDC00) + 0x10000;
  }
  return code;
}


// ^(a|b)\/+(?<V>hi\b)(?=ab|cde)\1\x{1234}\1\k<V>.([a-z0-9]*?|bb{1,12})$d