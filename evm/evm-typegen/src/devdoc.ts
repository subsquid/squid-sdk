const solc = require("solc");

interface Devdoc {
  details: string;
  params: {
    [name: string]: string;
  };
  returns: {
    [name: string]: string;
  };
}

function formatDevdoc(devdoc: Devdoc) {
  if (!devdoc.details && !devdoc.params && !devdoc.returns) {
    return undefined;
  }
  const details = devdoc.details ? ` * ${devdoc.details}\n` : "";
  const params = devdoc.params
    ? `${Object.entries(devdoc.params ?? [])
        .map(([name, details]) => ` * @param ${name} ${details}`)
        .join("\n")}\n`
    : "";
  const returns = devdoc.returns
    ? `${Object.entries(devdoc.returns ?? [])
        .map(
          ([name, details]) =>
            ` * @return ${name.match(/^_\d+$/) ? "" : name + " "}${details}`
        )
        .join("\n")}\n`
    : "";
  return `/**
${details}${params}${returns} */`;
}

export async function devdoc(
  source: string | object,
  settings: any,
  compilerVersion = 'latest'
) {
  let sources: {
    [name: string]: {
      content: string;
    };
  };
  if (typeof source === "string") {
    sources = {
      "Contract.sol": {
        content: source,
      },
    };
  } else {
    sources = source as any;
  }
  const input = {
    language: "Solidity",
    sources,
    settings: {
      ...settings,
      outputSelection: {
        "*": {
          "*": ["devdoc"],
        },
      },
    },
  };

  const output: any = await new Promise((resolve) =>
    solc.loadRemoteVersion(compilerVersion, (err: any, solcSnapshot: any) => {
      if (err) {
        resolve(undefined);
      }
      const output = JSON.parse(solcSnapshot.compile(JSON.stringify(input)));
      resolve(output);
    })
  );

  if (!output) {
    return {
      methods: {},
      events: {},
    };
  }

  const getDocs = (get: "events" | "methods") =>
    Object.values(output.contracts)
      .map((x: any) => Object.values(x))
      .flatMap((x: any) => x?.[0]?.devdoc?.[get] ?? [])
      .reduce((acc: any, x: any) => ({
        ...acc,
        ...x,
      }));
  const events = getDocs('events')
  const methods = getDocs('methods')
  const formattedMethods = Object.fromEntries(
    Object.entries(methods)
      .map(([name, doc]) => [name, formatDevdoc(doc as any)])
      .filter(([_, doc]) => !!doc)
  )
  const formattedEvents = Object.fromEntries(
    Object.entries(events)
      .map(([name, doc]) => [name, formatDevdoc(doc as any)])
      .filter(([_, doc]) => !!doc)
  )
  return {
    methods: formattedMethods,
    events: formattedEvents,
  }
}
