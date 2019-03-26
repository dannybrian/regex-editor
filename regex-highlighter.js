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
    // pattern didn't help to properly filter; not everything needs labeling,
    // only certain key types (there's nothing to label for Alternative and
    // Repetition, for example). So it works better to recurse the AST and just 
    // label the stuff we care about. This approach has the disadvantage that 
    // I can't represent nesting of rules in the display (e.g. a character class 
    // [a-z] will be represented without nodes for the individual characters),
    // but I think that highlighting expressions is what is useful anyway.
    
    const traverseAST = node => {
        let flat = [];
        
        if (node === undefined) return;

        if (node['type'] === 'Char') {
            flat.push({ type: 'Char', kind: node['kind'], string: node.loc.source });    
        }
        
        else if (node['type'] === 'Repetition' || node['type'] === 'Alternative') {
            // we don't go any deeper in to the tree than an expression...
            flat.push({ type: node.expression.type, string: node.expression.loc.source });
            if (node['quantifier']) {
                flat.push({ type: node.quantifier.type, string: node.quantifier.loc.source })
                //expr = { ...expr, }
            }
        }
        
        else if (node['type'] === 'Assertion') { // FIXME: we should go deeper in the tree for these
            flat.push({ type: node.type, kind: node.kind, string: node.loc.source });
        }
        
        else if (node['type'] === 'Group') { // FIXME: we should definitely delve into groups
            flat.push({ type: node.type, name: node.name, capturing: node.capturing, string: node.loc.source }); 
            if (node['quantifier']) {
                flat.push({ type: node.quantifier.type, string: node.quantifier.loc.source })
                //expr = { ...expr, }
            }
        }
        
        else if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                flat.push(...traverseAST(node[i]));
            }
        }
        
        return flat;
    };
    
    const makeHTML = array => {
          
    };
    
    ret.array = traverseAST(ast['body']['expressions']); // FIXME: will this always hold true?
    ret.text = textAr.join('');
    ret.flags = ast['flags'] || '';
    return ret;
};

export class RegexError extends Error {}

