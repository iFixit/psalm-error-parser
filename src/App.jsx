import nearley from "nearley";
import grammar from "./grammar.js";
import * as React from "react";

export function App() {
  const [str, setStr] = React.useState("");
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(str);
  const parsed = parser.results;
  console.log(parsed);
  const first = parsed.find((p) => p.length === 2);
  console.log("first", first);
  const expected = first?.length === 2;
  return (
    <>
      <style>
        {`
        table {
          border-collapse: collapse;
        }
        table, th, td {
          border: 1px solid black;
        }
        `}
      </style>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        <textarea
          style={{ width: "75%", height: "25vw" }}
          content={str}
          onChange={(e) => setStr(e.target.value)}
        />
        {expected && <ObjectComparer left={first[0]} right={first[1]} />}
        {!expected && first && (
          <div>
            Trouble parsing. Got<pre>{JSON.stringify(first)}</pre>
          </div>
        )}
        {!expected && !first && str && (
          <div>
            Trouble parsing. Got<pre>{JSON.stringify(parsed)}</pre>
          </div>
        )}
      </div>
    </>
  );
}

function ObjectComparer({ left, right }) {
  if (left.type !== right.type) {
    return (
      <div>
        Types don't match: {left.type} !== {right.type}
      </div>
    );
  }
  const type = left.type;
  console.log("type", type);
  const Renderer = renderTable[type] || renderTable.default;
  return <Renderer left={left.entries} right={right.entries} />;
}

const renderTable = {
  array_literal: EntryComparison,
  list_literal: EntryComparison,
  default: () => <div>Not supported</div>,
};

const renderEntry = {
  object: ObjectComparer,
  string: CompareString,
  default: ({ left, right }) => {
    const leftString = JSON.stringify(left, null, 2);
    const rightString = JSON.stringify(right, null, 2);
    return <CompareString left={leftString} right={rightString} />;
  }
};

function EntryComparison({ left, right }) {
  const leftIndexed = indexEntries(left);
  const rightIndexed = indexEntries(right);
  const keys = new Set([
    ...Object.keys(leftIndexed),
    ...Object.keys(rightIndexed),
  ]);
  const sortedKeys = [...keys].sort();
  return (
    <table style={{ width: "75%", tableLayout: "fixed" }}>
      <thead>
        <tr>
          <th>Key</th>
          <th>Left</th>
          <th>Right</th>
        </tr>
      </thead>
      <tbody>
        {sortedKeys.map((key) => {
          const left = leftIndexed[key];
          const right = rightIndexed[key];
          const color = left === right ? "black" : "red";
          if (typeof left !== typeof right) {
            return (<tr>
                <td>{key}</td>
                <renderEntry.default left={left} right={right} />
            </tr>)
          }
          const type = typeof left;
          const Renderer = renderEntry[type] || renderEntry.default;
          return (
            <tr>
              <td>{key}</td>
                <Renderer left={left} right={right} />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CompareString({ left, right }) {
  const color = left === right ? "black" : "red";
  return (
    <>
      <td style={{ color }}>{left}</td>
      <td style={{ color }}>{right}</td>
    </>
  );
}

function indexEntries(entries) {
  console.error(entries);
  const indexed = {};
  for (const entry of entries) {
    indexed[entry.key] = entry.value;
  }
  return indexed;
}
