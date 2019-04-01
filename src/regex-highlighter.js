const util = require('util'); // dev only
const ulog = require('ulog');
const regexpTree = require('regexp-tree');

/* This module will make a lot more sense if you read the regexp-tree docs :-) */

const log = ulog('rexeg-highlighter');
const errorRegex = new RegExp(/^SyntaxError:\s+(\/.+?\/)\s+\^\s+(Unexpected.+?):\s+"(.+?)"\s+at\s+(\d+):(\d+)\./, 'm');

const escapeRegex = (s) => {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
const escapeHTML = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Because the regexp-tree.js is generated, and I don't feel like 
// crawling into the source any more than I already have...
// plus hey I'm using regexes for *everything* else, may as well parse
// an error.

// regexHighlight: ({regex:String, type?:String}) => String
// IMPORTANT: the regex into needs to be a string

log.level = log.WARN;

export const regexHighlight = ({
    regex = '',
    type  = 'html' // html | term (term not implemented yet)
}) => {
    
    let err = {}, ret = {}, ast = {};
    
    if (typeof regex !== 'string') {
        throw new RegexError ('Parameter regex must be a string');    
    }
    
    // FIXME: we need to remove the {{}} syntax and then put it back, while adjusting 
    // the pattern length to accomodate them; kind of a pain.

    try {
        ast = regexpTree.parse(regex, { captureLocations: true });
        // log.debug(ast);
    }
    catch (err)
    {
        if (err === undefined) { // why aren't we getting an error?
            log.warn('Unknown regex parse error (no err caught)');
            return;
        }
        
        log.debug('Regex error: ' + err);
            
        let matches = errorRegex.exec(err);
        if (matches && matches.length > 0) {
            return { success: false, error: { message: matches[2], pattern: matches[1],
                     token: matches[3], line: matches[4], column: matches[5] } };
        }
        else
        {
            log.warn('Regex error: ' + err); // try an isolated backslash \ to see
            throw new RegexError ('Invalid regular expression, unknown error: ' + err);
        }
    }

    ret.success = true;
    ret.ast = ast;
    ret.regexString = regex;
    
    // console.log(util.inspect(ast, { showHidden: false, depth: null, colors: true }));
    
    // I initially implemented this using regexpTree.traverse, left it, and came
    // back. It's the right way if I want to highlight, say, stuff inside of an 
    // assertion or large group. Otherwise the highlighting isn't very useful.
    
    // Note that I've limited all the HTML-y transformation to this addHTML() function,
    // which means that the AST node processing down below (regexpTree.traverse()) 
    // needs to stick to the common object properties, and call addHTML() to do their 
    // escaping for them (or they can write to {html}) directly.
    //
    //   {string} is for the displayable regex content
    //   {prefix} for stuff to come before it
    //   {suffix} after
    //
    // I did this only so I wouldn't have to write <span> so many times. NONE of these
    // properties should do their own escaping of markup content, and should only
    // provide display markup inside the {html} property, which we won't touch here.
    
    const addHTML = token => {
        if (token['html']) {
            log.warn('addHTML token already has {html}..');
        }
        
        token.html = '';
        if (token['prefix']) {
            token.html += `<span class='${token.type} ${token.kind || ''}'  >${escapeHTML(token.prefix)}`;
        }
        if (token['string'])
        {
            token.html += `<span class='${token.type} ${token.kind || ''}'>${escapeHTML(token.string)}</span>`;
        }
        if (token['suffix']) { // we can only have one or the other
            token.html += escapeHTML(token.suffix) + '</span>';
        }
        
        return token;
    };
    
    let array = [];
    let disjunctBool = false;
    ret.re = regexpTree.traverse(ast, {
        
        /* man this is such a well-designed API, I just want to say; should keep this 
           visitor pattern in mind, it's like SAX but so much easier... */
        
        '*': function(node) {
            if (node.property === 'right') {
              /* The pipe is a bit tricky because many node types can be to the right
                 of alternation, and I don't want to test every one below; also we have 
                 no hook to process every node afterwards, so we're doing it here. */
              
              // splice the pipe (disjunction or)
              array.push( { type: node.node.type, html: '<span class="DisjunctionMetaChar">|</span>' } );
            }
            
            log.debug("Node PROPERTY: " + node.property + ",  TYPE: " + node.node.type);
        },
        
        Alternative: {
            pre({node}) {
                array.push({ type: node.type, html: '<span class="Alternative">' });
            },
            post({node}) {
                array.push({ type: node.type, html: '</span>' });
            }
        },
        Assertion: {
            pre({node}) {
                let rprefix;
                if (node.kind === 'Lookahead')
                {
                    rprefix = node.negative ? '(?!' : '(?=';
                }
                else if (node.kind === 'Lookbehind')
                {
                    rprefix = node.negative ? '(?<!' : '(?<=';
                }
                else
                {
                    node.kind = node.kind === '^' ? 'AnchorFront' : // ^
                             node.kind === '$' ? 'AnchorBack' : // $
                             'WordBound'; // \\b, but includes \\B too! don't think it matters for highlighting..
                 }
                array.push(addHTML( { type: node.type, kind: node.kind, negative: node['negative'], prefix: rprefix ? rprefix : node.loc.source } ));
            },
            post({node}) {
                if (node.kind === 'Lookahead' || node.kind === 'Lookbehind')
                {
                    array.push({ kind: node.kind, html: ")" });
                }
                array.push({ kind: node.kind, html: "</span>" });
            }
        },
        Backreference({node}) {
            array.push(addHTML( { type: node.type, kind: node.kind, name: node['name'], number: node['number'], reference: node.reference, string: node.loc.source } ));
        },
        Char(node) {
            if (node.property === 'to') {
                /* splice the dash (classrange to); I *think* this should always work
                   because there's nothing else that can be part of a range, right?
                   a char class considers everything in it to be literal ... */
                array.push( { type: node.type, html: '-' } );
            }
            
            node = node.node; // we don't need anything else on NodePath
            
            let token = { type: node.type, kind: node.kind, escaped: node['escaped'], 
                          string: node.loc.source };
                
            array.push(addHTML(token));
            
        },
        CharacterClass:  {
            pre({node}) {
                array.push(addHTML(
                    { type: node.type, negative: node['negative'], prefix: "[" }
                ));
            },
            post({node}) {
                array.push(addHTML( { type: node.type, suffix: "]" } ));
            }
        },
        ClassRange: {
            pre({node}) {
                array.push({ type: node.type, kind: node.kind, html: `<span  class='ClassRange'>` });
            },
            post({node}) {
                array.push({ type: node.type, html: `</span>`});
            }
        },
        Disjunction: {
            pre({node}) {
                array.push({ type: node.type, html: `<span class='Disjunction'>` } );
            },
            post({node}) {
                 /* there is an edge case where the user hasn't yet provided anything 
                 to the right of the pipe, but the parser still knows we've provided the 
                 left, and anything can come to the left; consider:
                 
                 PROPERTY: body, TYPE: Disjunction
                 PROPERTY: left, TYPE: Group
                 PROPERTY: expression, TYPE: Alternative
                 PROPERTY: expressions, TYPE: Char

                 That is, it's a "proper" parse but it doesn't include the pipe.
                 
                 So the challenge here was, how to know to insert the pipe char after 
                 the expressions above (which are technical part of the GROUP, which
                 is part of the Disjunction). That is, it still parses, just without 
                 the disjunction resolved. I solve this ug-ily by seeing if the 
                 parent node has a {right} and if not, see if the last char is a pipe,
                 and add it if so. FIXME this is so hacky.. */
                
                if (node['left'] && !node['right']) {
                    // log.debug('Disjunction missing right...');
                    if (ret.regexString.substr(-2, 1) === '|') {
                        array.push( { type: node.type, html: '<span class="DisjunctionMetaChar">|</span>' } );
                    }
                }
                else
                {
                    array.push({ type: node.type, html: '</span>'});
                }
            }
        },
        Group: {
            pre({node}) {
                let prefix, suffix;
                if (node.capturing) {
                    if (node['name']) {
                        // one-off to format this ourselves, it's
                        // more complex than the others
                        prefix = '(?';
                        array.push( addHTML({ type: node.type, kind: 'Named', 
                                             number: node.number, prefix: prefix }) );
                        array.push( { type: node.type,
                                      html: `<span class='Group Named'>&lt;<span class='CaptureName'>${node.name}</span>&gt;</span>`
                                    } );
                        return;
                    }
                    else
                    {
                        prefix = '(';
                    }
                }
                else
                {
                    prefix = '(?:';
                }
                
                array.push( addHTML({ type: node.type, capturing: node.capturing,
                            number: node.number, name: node.name, prefix: prefix,
                            suffix: suffix }) );
            },
            post({node}) {
                array.push({ type: node.type, html: `)</span>`});
            }
        },
        Quantifier({node}) {
            array.push(addHTML( { type: node.type, kind: node.kind, greedy: node.greedy, string: `${node.loc.source}` } ));
        },
        RegExp(node) {
            // nothing here for now, but we could get fancy.
        }
      },
    );
    
    ret.array = array;
    ret.html = ret.array.map((token) => token.html).join('');
    /* NOTE: I'm well aware of how costly the innerHTML call is for the client here,
       and I've considered ways to avoid that; upper and lower div's could be a long list 
       of empty (&nbsp) spans that we just attach classes to. I could also throw a virtual
       DOM in front of this. In the end I'm content that this is fast enough for modern browsers (less than 100ms, I'd guess) that replacing the DOM subtree is good enough.
       The one FIXME change I want to make is to have it run a) debounced, and b) async.
    */
    ret.flags = ast['flags'] || '';
    return ret;
};

export class RegexError extends Error {}

