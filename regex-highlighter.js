const util = require('util'); // dev only

const regexpTree = require('regexp-tree');
const errorRegex = new RegExp(/^SyntaxError:\s+(\/.+?\/)\s+\^\s+(Unexpected.+?):\s+"(.+?)"\s+at\s+(\d+):(\d+)\./, 'm');
// Because the regexp-tree.js is generated, and I don't feel like 
// crawling into the source any more than I already have...
// plus hey I'm using regexes for *everything* else, may as well parse
// an error.

// regexHighlight: ({regex:String, type?:String}) => String
// IMPORTANT: the regex into needs to be a string

export const regexHighlight = ({
    regex = '',
    type  = 'html' // html | term
}) => {
    
    let err = {}, ret = {}, ast = {};
    
    if (typeof regex !== 'string') {
        throw new RegexError ('Parameter regex must be a string');    
    }
    
    // FIXME: we need to remove the {{}} syntax and then put it back, while adjusting 
    // the pattern length to accomodate them; kind of a pain.

    try {
        ast = regexpTree.parse(regex, { captureLocations: true });
    }
    catch (err)
    {
        let matches = errorRegex.exec(err);
        if (matches.length > 0) {
            return { success: false, message: matches[2], pattern: matches[1],
                     token: matches[3], line: matches[4], column: matches[5] };
        }
        else
        {
            throw new RegexError ('Invalid regular expression, unknown error');        
        }
    }

    ret.success = true;
    ret.ast = ast;
    
    console.log(util.inspect(ast, { showHidden: false, depth: null, colors: true }));
    
    // I initially implemented this using regexpTree.traverse, left it, and came
    // back. It's the right way if I want to highlight, say, stuff inside of an 
    // assertion or large group. Otherwise the highlighting isn't very useful.
    const addHTML = token => {
        if (token['prefix']) {
            token.html = `<span class='${token.type} ${token.kind || ''}'>${token.prefix}`;
        }
        else if (token['suffix']) { // we can only have one or the other
            token.html = `${token.suffix}</span>`;
        }
        else
        {
            token.html = `<span class='${token.type} ${token.kind || ''}'>${token.string}</span>`;
        }
        return token;
    };
    
    let array = [];
    ret.re = regexpTree.traverse(ast, {
        
        Alternative({node}) {
            array.push(addHTML( { type: node.type, string: node.loc.source } ));
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
                array.push(addHTML( { type: node.type, kind: node.kind, negative: node['negative'], string: rprefix ? rprefix : node.loc.source } ));
            },
            post({node}) {
              array.push({ html: ")</span>" });
            }
        },
        Backreference({node}) {
            array.push(addHTML( { type: node.type, kind: node.kind, name: node['name'], number: node['number'], reference: node.reference, string: node.loc.source } ));
        },
        Char({node}) {
            let token = { type: node.type, kind: node.kind, escaped: node['escaped'], string: node.loc.source };
            if (node.append) {
                token.html = node.append;
            }
            array.push(addHTML(token));
        },
        CharacterClass:  {
            pre({node}) {
                array.push(addHTML(
                    { type: node.type, negative: node['negative'], string: node.loc.source, prefix: "[" }
                ));
            },
            post({node}) {
              array.push(addHTML( { suffix: "]" } ));
            }
        },
        ClassRange: {
            pre({node}) {
                array.push({ type: node.type, kind: node.kind, html: `<span class='ClassRange'>` });
            },
            post({node}) {
                array.splice(-1, 0, { type: node.type, html: '-' } );
                array.push({ html: `</span>`});
            }
        },
        Disjunction: {
            pre({node}) {
                array.push({ type: node.type, html: `<span class='Disjunction'>` } );
                
            },
            post({node}) {
                array.splice(-1, 0, { type: node.type, html: '-' } );
                array.push({ html: `</span>`});
            }
        },
        Group: {
            pre({node}) {
                let prefix;
                prefix = node.capturing ? 
                         (node.name ? `(?<${node.name}>` : '(')
                          : '(?:';
                
                array.push( addHTML({ type: node.type, capturing: node.capturing, number: node.number, name: node.name, prefix: prefix  }) );
            },
            post({node}) {
                array.push({ type: node.type, html: `)</span>`});
            }
        },
        Quantifier({node}) {
            array.push(addHTML( { type: node.type, kind: node.kind, greedy: node.greedy, string: `${node.loc.source}` } ));
        }
      },
    );
    
    ret.array = array;

    const makeHTML = array => {
          
    };
    
    ret.text = array.join('');
    ret.flags = ast['flags'] || '';
    return ret;
};

export class RegexError extends Error {}

