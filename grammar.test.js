const fs = require('fs');
const nearley = require('nearley');
const compiledGrammar = require('./src/grammar');

const examples = fs.readFileSync('examples.txt', 'utf8').split('\n');

test.each(examples)('Parsing "%s"', (example) => {
    const grammar = nearley.Grammar.fromCompiled(compiledGrammar)
    const parser = new nearley.Parser(grammar);
    parser.feed(example);
    expect(parser.results.length).toBe(1);
});

