const regexpTree = require('regexp-tree');

//var regex1 = '/q(?!u)(\w+)[a-z]{1,}(?<hello>{{hello}})/i';

// Get AST.
//const ast = regexpTree.parse(regex1, { captureLocations: true });
 
//console.log(JSON.stringify(ast, null, '\t'));

// regexHighlight: ({regex:String, type?:String}) => String

const regexHighlight = ({
    regex = '',
    type  = 'html' // html | console
}) => {
    let err, parsed;
    const errorRegex = new RegExp(/^SyntaxError:\s+(\/.+?\/)\s+\^\s+Unexpected token:\s+"(.+?)"\s+at\s+(\d+):(\d+)\./, 'm');
    // because the regexp-tree.js is generated, and I don't feel like 
    // crawling into the source any more than I already have...
    // plus hey I'm using regexes for *everything* else, may as well parse
    // an error.
    
    try {
        parsed = regexpTree.parse(regex, { captureLocations: true });
    }
    catch (err)
    {
        let matches = errorRegex.exec(err);
        throw { text: 'Unexpected token in regex parse', pattern: matches[1], token: matches[2], line: matches[3], column: matches[4] };
    }
    
    return parsed;
    
};

export default regexHighlight;

