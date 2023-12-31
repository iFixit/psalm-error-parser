import nearley from "nearley";
import grammar from "./grammar.js";
import * as React from "react";

export function App() {
  const [str, setStr] = React.useState("");
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
        {str && <RenderComparison str={str} />}
      </div>
    </>
  );
}

export function RenderComparison({ str }) {
  const parsed = parse(str);
  if (parsed.message !== undefined) {
    return <ParseErrorMessage message={parsed.message} />;
  }
  const first = parsed.find((p) => p.length === 2);
  console.log("first", first);
  const expected = first?.length === 2;

  if (expected) {
    return <ObjectComparer left={first[0]} right={first[1]} />;
  }

  if (first) {
    return <ErrorMessage message={JSON.stringify(first, null, 2)} />;
  }

  return <ErrorMessage message={JSON.stringify(parsed, null, 2)} />;
}

function ParseErrorMessage({ message }) {
  const chunks = message.split("\n\n");
  const errorMessage = chunks[0];
  const input = chunks[1];
  const [inputText, marker] = input.split("\n");
  const markerOffset = marker.indexOf("^");
  const inputBeforeOffset = inputText.slice(0, markerOffset);
  const inputAfterOffset = inputText.slice(markerOffset + 1);
  const inputAtOffset = inputText[markerOffset];
  const description = chunks.slice(2).join("\n\n");
  return (
    <>
      <pre>{errorMessage}</pre>
      <pre style={{ overflow: "scroll", width: "75%" }}>
        <pre>
          {inputBeforeOffset}
          <span style={{ color: "red" }}>{inputAtOffset}</span>
          {inputAfterOffset}
        </pre>
        <pre style={{ color: "red" }}>{marker}</pre>
      </pre>
      <pre style={{ width: "75%", whiteSpace: "pre-wrap" }}>{description}</pre>
    </>
  );
}

function ErrorMessage({ message }) {
  return (
    <>
      Trouble parsing.
      <pre style={{ width: "75%", whiteSpace: "pre-wrap" }}>{message}</pre>
    </>
  );
}

function parse(str) {
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(str);
    const parsed = parser.results;
    console.log(parsed);
    return parsed;
  } catch (error) {
    return error;
  }
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
  return <Renderer left={left} right={right} />;
}

const renderTable = {
  array_literal: ArrayLiteralComparison,
  list_literal: ArrayLiteralComparison,
  array: ArrayComparison,
  list: ArrayComparison,
  default: () => <div>Not supported</div>,
};

function ArrayComparison({ left, right }) {
  console.log(JSON.stringify(left, null, 2));
  console.log(JSON.stringify(right, null, 2));

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Left</th>
          <th>Right</th>
        </tr>
      </thead>
      <tbody>
        <RenderDescriptionCells
          keyName="Key Type"
          left={left.keyType}
          right={right.keyType}
        />
        <RenderDescriptionCells
          keyName="Value Type"
          left={left.valueType}
          right={right.valueType}
        />
      </tbody>
    </table>
  );
}

const renderEntry = {
  object: ({ left, right }) => {
    return (
      <td colspan="2">
        <ObjectComparer left={left} right={right} />
      </td>
    );
  },
  string: CompareString,
  default: ({ left, right }) => {
    const leftString = JSON.stringify(left, null, 2);
    const rightString = JSON.stringify(right, null, 2);
    return <CompareString left={leftString} right={rightString} />;
  },
};

function ArrayLiteralComparison({ left, right }) {
  const leftEntries = left.entries;
  const rightEntries = right.entries;
  const leftIndexed = indexEntries(leftEntries);
  const rightIndexed = indexEntries(rightEntries);
  const keys = new Set([
    ...leftIndexed.keys(),
    ...rightIndexed.keys(),
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
          const left = leftIndexed.get(key);
          const right = rightIndexed.get(key);
          console.log(typeof key)
          return (
            <RenderDescriptionCells keyName={key} keyType={typeof key} left={left} right={right} />
          );
        })}
      </tbody>
    </table>
  );
}

function RenderDescriptionCells({ keyName, keyType, left, right }) {
  const leftType = findType(left);
  const rightType = findType(right);
  const Renderer =
    leftType === rightType ? (renderEntry[leftType] || renderEntry.default) : renderEntry.default;
    console.log(keyType)
  const KeyRenderer = keyType === "number" ? IntKeyCell : KeyCell
  return (
    <tr>
      <KeyRenderer>{keyName}</KeyRenderer>
      <Renderer left={left} right={right} />
    </tr>
  );
}

function KeyCell({children}) {
  return <td>{children}</td>
}

function IntKeyCell({children}) {
  return <td style={{color: "blue"}}>{children}</td>
}

function findType(left) {
  if (left === null) {
    return "null";
  }
  return typeof left;
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
  return new Map(entries.map(entry => [entry.key, entry.value]));
}
