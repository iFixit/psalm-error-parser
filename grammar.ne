main -> main_body:* {% x => EXTRACT(x).filter(x => x) %}
main_body -> (array_literal | array_record | list_literal | list_record | text) {% ALT_EXTRACT %}
array_literal -> "array{" _ "}" {% x => array_literal() %}
              | "array{" _ keyval_body _ "}"  {% x => array_literal(x[2]) %}
              | "array{" _ keyval_body _ "," _ "...<" type "," __ type ">" _ "}" {% x => array_literal(x[2], x[7]) %}
list_literal -> "list{" _ "}" {% x => list_literal() %}
             | "list{" _ list_body _ "}" {% x => list_literal(x[2]) %}
			 | "list{" _ list_body _ "," _ "...<" type ">" _ "}" {% x => list_literal(x[2], x[7]) %}

keyval_body -> literal_body ("," _ literal_body):* {% ([first, repeat]) => flatten_csv(first, repeat, (x) => x[2]) %}
literal_body -> key "?":? ":" _ type {% x => kv(x[0], x[4]) %}
list_body -> type ("," _ type):* {% ([first, repeat]) => flatten_csv(first, repeat, (x) => x[2]) %}

array_record -> "array<" type "," __ type ">" {% x => record_type("array", x[1], x[4]) %}
             | "array<" type ">" {% x => record_type("array", "array-key", x[1]) %}
list_record -> "list<" type ">" {% x => record_type("list", "int", x[1]) %}

key -> (keyword|sqstring) {% ALT_EXTRACT %}
type -> (keyword|array_literal|array_record|list_literal|list_record) {% ALT_EXTRACT %}
     | "array-key" {% EXTRACT %}
     |sqstring {% x => `'${x}'` %}
keyword -> [a-zA-Z_0-9]:+ {% x => x[0].join("") %}
text -> [^{<] {% x => null %}
_ -> [ \t]:* {% x => null %}
__ -> [ \t]:+ {% x => null %}
sqstring -> "'" sqchar:* "'" {% x => x[1].join("") %}
sqchar -> [^'] {% EXTRACT %}
        |"\\'" {% x => "'" %}


@{% function EXTRACT(x) { return x[0]; } %}
@{% function ALT_EXTRACT(x) { return x[0][0]; } %}
@{% function kv(key, value) { return {key, value}; } %}
@{% function array_literal(entries = [], rest) {
	const type = "array_literal"
	if (rest) {
		return {
			type,
			entries: [
				...entries,
				kv("...rest", rest),
			],
		};
	}
	return {
		type,
		entries,
	};
} %}
@{% function list_literal(entries = [], rest) {
	const type = "list_literal"
    const pairedEntries = entries.map((e, i) => kv(i, e))
	if (rest) {
		return {
			type,
			entries: [
				...pairedEntries,
				kv("...rest", rest),
			],
		};
	}
	return {
		type,
		entries: pairedEntries,
	};
} %}
@{% function record_type(type, keyType, valueType) { return {type, keyType, valueType}; } %}
@{% function flatten_csv(first, rest, extraction) {
	return [first, ...rest.map(extraction)];
} %}