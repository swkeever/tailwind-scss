const fs = require('fs');
let { theme } = require('../stubs/defaultConfig.stub');
const _ = require('lodash');
const srcDir = 'src/lib/tailwind';
const keysToOmit = [
  'flex',
  'grid',
  'background',
  'container',
  'cursor',
  'fill',
  'inset',
  'listStyle',
  'objectPosition',
  'min',
  'max',
  'zIndex',
  'stroke',
  'transform',
];
const subKeysToOmit = ['colors.current', 'colors.transparent'];
const categories = {
  breakpoints: ['screens'],
  colors: [
    'black',
    'white',
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'teal',
    'blue',
    'indigo',
    'purple',
    'pink',
  ],
  spacing: ['spacing'],
  borders: ['borderRadius', 'borderWidth'],
  effects: ['boxShadow', 'opacity'],
  typography: [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
  ],
  transitions: [
    'transitionProperty',
    'transitionTimingFunction',
    'transitionDuration',
    'transitionDelay',
  ],
  transforms: ['scale', 'rotate', 'skew'],
};

function toKebabCase(string) {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function objToSassList(name, obj) {
  res = `$${name}: (\n`;

  Object.entries(obj).forEach(([k, v], idx) => {
    const val = v.includes(', ') || _.isArray(v) ? `(${v})` : v;
    res += `  ${k}: ${val},\n`;
  });

  return res + ');';
}

function lstToSassList(name, lst) {
  return `$${name}: (${lst.join(', ')});`;
}

function makeFunction(name, data) {
  let result = `@function ${name}`;
  result += `($value`;
  let defaultVal = '';

  if (Object.keys(data).includes('default')) {
    defaultVal += ': default';
  } else if (Object.keys(data).includes('normal')) {
    defaultVal += ': normal';
  }

  result += defaultVal;
  result += ') {\n';
  result += `  @if index($${name}, $value) != null {\n`;
  result += `    @error "#{value} does not exist in $${name}.";\n`;
  result += '  }\n';
  result += `  @return map-get($${name}, $value);\n`;
  result += '}\n\n';

  return result;
}

function processColors(data) {
  let result = `@function color($color, $weight: 500) {\n`;
  result += `  @if not variable-exists(#{color}) {\n`;
  result += `    @error "#{color} does not exist";\n`;
  result += `  }\n`;
  result += `  @else if type-of($color) != 'map' {\n`;
  result += `    @return $color;\n`;
  result += `  }\n`;
  result += `  @else if index($color, $weight) != null {\n`;
  result += `    @error "#{weight} does not exist in #{color}";\n`;
  result += `  }\n`;
  result += `  @else {\n`;
  result += `    @return map-get($color, $weight);\n`;
  result += `  }\n`;
  result += `}\n\n`;

  Object.entries(data).forEach(([k, v]) => {
    result += `${toSassList(k, v)}\n\n`;
  });

  return result;
}

function toSassList(name, value) {
  if (_.isObject(value)) {
    return objToSassList(name, value);
  } else if (_.isArray(value)) {
    return lstToSassList(name, value);
  } else {
    return `$${name}: ${value};`;
  }
}

function processCategory(category, data) {
  if (category === 'colors') {
    // special case for colors
    return processColors(data);
  }
  let result = '';
  Object.entries(data).forEach(([name, value]) => {
    const fmtName = toKebabCase(name);
    result += makeFunction(fmtName, value);
    result += toSassList(fmtName, value);
    result += '\n\n';
  });
  return result;
}

function filePreamble() {
  let result = '// DO NOT MODIFY THIS FILE. THIS FILE WAS GENERATED.\n';
  result += '// Inspired by Tailwind CSS: https://tailwindcss.com/\n';
  return result;
}

function makeFile(category, data) {
  const fileName = `${srcDir}/_${category}.scss`;
  let writeData = filePreamble();
  writeData += _.isObject(data) ? processCategory(category, data) : data;
  fs.writeFile(fileName, writeData, (err) => {
    if (err) throw err;
    console.log(`- ${fileName}`);
  });
}

//
// MAIN SCRIPT
//
// preprocessing
theme = _.omitBy(theme, _.isFunction);
theme = _.omitBy(theme, (v, k) => keysToOmit.some((str) => k.includes(str)));
theme = _.omit(theme, subKeysToOmit);
theme = _.merge(theme, theme.colors);
delete theme.colors;

// write to files
console.log('successfully wrote:');
Object.entries(categories).forEach(([category, properties]) => {
  const data = _.pick(theme, properties);
  makeFile(category, data);
});

// write index file
let indexFileData = '';
Object.keys(categories).forEach(category => {
  indexFileData += `@import '${category}';\n`;
})
makeFile('index', indexFileData);
