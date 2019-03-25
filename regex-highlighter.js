const regexpTree = require('regexp-tree');
const errorRegex = new RegExp(/^SyntaxError:\s+(\/.+?\/)\s+\^\s+(Unexpected.+?):\s+"(.+?)"\s+at\s+(\d+):(\d+)\./, 'm');
// Because the regexp-tree.js is generated, and I don't feel like 
// crawling into the source any more than I already have...
// plus hey I'm using regexes for *everything* else, may as well parse
// an error.

// regexHighlight: ({regex:String, type?:String}) => String
// IMPORTANT: the regex into needs to be a string

const regexHighlight = ({
    regex = '',
    type  = 'html' // html | term
}) => {
    let err, parsed;
    
    if (typeof regex !== 'string') {
        throw { message: 'Parameter regex must be a string' };    
    }
    
    
    
    // FIXME: we need to remove the {{}} syntax and then put it back, while adjusting 
    // the pattern length to accomodate them; kind of a pain.

    try {
        parsed = regexpTree.parse(regex, { captureLocations: true });
    }
    catch (err)
    {
        let matches = errorRegex.exec(err);
        if (matches.length > 0) {
            throw { message: matches[2], pattern: matches[1], token: matches[3], line: matches[4], column: matches[5] };
        }
        else
        {
            throw { message: "Invalid regular expression, unknown error" };        
        }
    }
    
    return parsed;
    
};

export default regexHighlight;

