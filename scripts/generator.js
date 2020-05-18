const fs = require("fs");
const toSassVariable = require("./resolvers");
const { toKebabCase } = require("./utils");
const _ = require("lodash");
const srcDir = "src/lib/tailwind";

const colorFunction = `@function color($color, $weight: 500) {
  @if not variable-exists(#{color}) {
    @error "#{color} does not exist";
  }
  @else if type-of($color) != 'map' {
    @return $color;
  }
  @else if index($color, $weight) != null {
    @error "#{weight} does not exist in #{color}";
  }
  @else {
    @return map-get($color, $weight);
  }
}

`;

function generateFunction(name, data) {
  const defaultVal = () => {
    if (Object.keys(data).includes("default")) {
      return ": default";
    } else if (Object.keys(data).includes("normal")) {
      return ": normal";
    } else {
      return "";
    }
  };

  return `@function ${name}($value${defaultVal()}) {
  @if index($${name}, $value) != null {
    @error "#{value} does not exist in $${name}.";
  }
  @return map-get($${name}, $value);
}
  
`;
}

function generateColors(data) {
  let result = colorFunction;

  Object.entries(data).forEach(([k, v]) => {
    result += `${toSassVariable(k, v)}\n\n`;
  });

  return result;
}

function generateCategory(category, data) {
  if (category === "colors") {
    // special case for colors
    return generateColors(data.colors);
  }
  let result = "";
  Object.entries(data).forEach(([name, value]) => {
    // TODO: should we handle colors?
    if (!name.toLowerCase().includes("color")) {
      const fmtName = toKebabCase(name);
      result += generateFunction(fmtName, value);
      result += toSassVariable(fmtName, value);
      result += "\n\n";
    }
  });
  return result;
}

function generatePreamble() {
  return `// ***************************************************
// DO NOT MODIFY THIS FILE. THIS FILE WAS GENERATED.
// Inspired by Tailwind CSS: https://tailwindcss.com/
// ***************************************************

`;
}

function generateIndexFile(categories) {
  let indexFileData = "";
  Object.keys(categories).forEach((category) => {
    indexFileData += `@import '${category}';\n`;
  });
  generateFile("index", indexFileData);
}

function generateFile(category, data) {
  const fileName = `${srcDir}/_${category}.scss`;
  let writeData = generatePreamble();
  writeData += _.isObject(data) ? generateCategory(category, data) : data;
  fs.writeFile(fileName, writeData, (err) => {
    if (err) throw err;
    console.log(`* ${fileName}`);
  });
}

module.exports = {
  generateFile,
  generateIndexFile,
};
