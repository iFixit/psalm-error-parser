main -> surrounded_quot:+ {% x => x[0] %}
surrounded_quot -> junk:? quot junk:? {% x => x[1] %}
quot -> "'" expr "'" {% x => x[1] %}
expr -> (array_literal|record) {% x => x[0][0]%}
junk -> [^']:+ {% (x) => null %}
record -> array_type "<" type "," ws:* value ">" {% x => ({type: x[0][0], keyType: x[2], valueType: x[5]}) %}
type -> key {% x => x[0] %}
array_literal -> array_type "{" (CONTENT repeated_content:*):? "}" {% x => {const c = x[2]; if (!c) {return null}; return {type: x[0] + "_literal", entries: [c[0], ...c[1]]}} %}
array_type -> ("array"|"list") {% x => x[0] %}
repeated_content -> "," ws:? CONTENT {% x => x[2] %}
CONTENT -> key ":" ws value {% x => ({key: x[0], value: x[3]}) %}
key -> [a-zA-Z0-9_-]:+ {% x => x[0].join('') %}
ws -> " ":+ {% x => null %}
value -> (blob_value | expr) {% x => x[0][0] %}
blob_value -> [^,}]:+ {% x => x[0].join("") %}