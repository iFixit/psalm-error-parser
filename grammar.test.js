const fs = require('fs');
const nearley = require('nearley');
const grammar = require('./src/grammar');

const examples = fs.readFileSync('examples.txt', 'utf8').split('\n');

test.each(examples)('Parsing "%s"', (example) => {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(example);
    expect(parser.results.length).toBeGreaterThan(0);
});

