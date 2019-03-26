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
    let text = '';
    let textAr = [];
    
    ret.ast = ast;
    
    // I initially implemented this using regexpTree.traverse, but the visiting 
    // didn't give me the pattern to properly filter; not everything needs 
    // labeling, only certain key types (there's nothing to label for Alternative and
    // Repetition, for example). So it works better to recurse the AST and just 
    // label the stuff we care about.
    
    ret.re = regexpTree.traverse(ast, {
        Char({node}) {
            textAr.push("<span class='char " + node.kind + "'>" + (node['escaped'] ? "\\" : "") + node.value + "</span>");
        },
        CharacterClass:  {
            pre({node}) {
              textAr.push("<span class='charclass " + node.type + "'>[" + (node['negative'] ? "^" : ""));
            },
            post({node}) {
              textAr.push("]</span>");
            }
            
        }
      },
    );
    ret.array = textAr;
    ret.text = textAr.join('');
    return ret;
};

export class RegexError extends Error {}

