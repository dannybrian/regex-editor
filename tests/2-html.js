const util = require('util');
import { parse } from 'node-html-parser';
import test from 'ava';
import { regexHighlight, RegexError } from '../src/regex-highlighter';

const escapeRegExp = (string) => {
  return String.raw`{$string}`.replace(/\\/g, '\\\\');
};

test('import', t => {
  t.truthy(regexHighlight);
});

test('well-formed HTML', t => {
    let regex = escapeRegExp('(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])'); // escape 's here ^
    
    const regexHL = regexHighlight({ regex: '/' + regex + '/' });
    t.true(regexHL.success);
    let root = parse(regexHL.html);
    t.truthy(root);
});

