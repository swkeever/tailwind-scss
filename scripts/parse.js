const fs = require('fs');
let { theme } = require('../stubs/defaultConfig.stub');
const _ = require('lodash');
const srcDir = 'src/lib/tailwind';
const keysToOmit = [
  'background',
  'fill',
  'container',
  'cursor',
  'inset',
  'listStyle',
  'objectPosition',
  'transform',
];
const colors = [
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
];
const subKeysToOmit = ['stroke', 'colors.current', 'colors.transparent'];
const categories = {
  breakpoints: ['screens'],
  colors: ['colors'],
  spacing: ['spacing'],
  borders: ['borderColor', 'borderRadius', 'borderWidth'],
  effects: ['boxShadow', 'opacity'],
  layout: ['zIndex'],
  flexbox: ['flex', 'flexGrow', 'flexShrink', 'order'],
  grid: [
    'gridTemplateColumns',
    'gridColumn',
    'gridColumnStart',
    'gridColumnEnd',
    'gridTemplateRows',
    'gridRow',
    'gridRowStart',
    'gridRowEnd',
  ],
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
  sizing: ['height', 'maxWidth', 'maxHeight', 'margin', 'width'],
  transforms: ['scale', 'rotate', 'skew'],
  svg: ['strokeWidth'],
};

// console.log(theme.backgroundColor.toString());

function toKebabCase(string) {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function objToSassVariable(name, obj) {
  res = `$${name}: (\n`;

  Object.entries(obj).forEach(([k, v], idx) => {
    const val = v.includes(', ') || _.isArray(v) ? `(${v})` : v;
    const key = k.includes('/') ? `"${k}"` : k
    res += `  ${key}: ${val},\n`;
  });

  return res + ');';
}

function arrToSassVariable(name, lst) {
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
    result += `${toSassVariable(k, v)}\n\n`;
  });

  return result;
}

function resolveTheme(str) {
  const searchFor = 'theme(';
  str = str.substr(str.indexOf(searchFor) + searchFor.length + 1);
  str = str.substr(0, str.indexOf("'"));
  return theme[str];
}

function fnToSassVariable(name, value) {
  const fnString = value.toString();
  // console.log('hello')
  console.log(fnString);
  const idx = fnString.indexOf('=>') + 3;
  let obj = fnString.substr(idx).trim();

  let themeObj = resolveTheme(obj);
  // console.log(themeObj)

  // filter out the trailing parens/curly braces
  if (obj[0] === '(' && obj[obj.length - 1] === ')') {
    obj = obj.substring(1, obj.length - 1);
    if (obj[0] == '{') {
      obj = obj.substring(1);
    }
    if (obj[obj.length - 1] === '}') {
      obj = obj.substring(0, obj.length - 1);
    }
    if (obj[obj.length - 1] === ',') {
      obj = obj.substring(0, obj.length - 1);
    }
  }

  obj = obj
    .replace(/\s+/g, '')
    .replace(/\.\.\..*\'\),?/gm, '')
    .split(/,(?=(?:(?:[^\']*\'){2})*[^\']*$)/)
    .filter((s) => !_.isEmpty(s));

  let newobj = {};

  // convert the string to an object
  obj.forEach((s) => {
    let [k, v] = s.split(':');
    if (k && v) {
      const removeQuotes = /["']/g;
      v = v.replace(removeQuotes, '');
      k = k.replace(removeQuotes, '');
      newobj = {
        ...newobj,
        [k]: v,
      };
    }
  });

  obj = newobj;

  // append the theme object if available
  if (themeObj) {
    obj = {
      ...obj,
      ...themeObj,
    };
  }

  if (obj) {
    console.log('if', obj);
    return objToSassVariable(name, obj);
  } else {
    console.log('else', obj);
    return '';
  }
}

function toSassVariable(name, value) {
  if (_.isFunction(value)) {
    return fnToSassVariable(name, value);
  } else if (_.isObject(value)) {
    return objToSassVariable(name, value);
  } else if (_.isArray(value)) {
    return arrToSassVariable(name, value);
  } else {
    return `$${name}: ${value};`;
  }
}

function processCategory(category, data) {
  if (category === 'colors') {
    // special case for colors
    // console.log('COLORS', data)
    return processColors(data.colors);
  }
  let result = '';
  Object.entries(data).forEach(([name, value]) => {
    if (!name.toLowerCase().includes('color')) {
      const fmtName = toKebabCase(name);
      result += makeFunction(fmtName, value);
      result += toSassVariable(fmtName, value);
      result += '\n\n';
    }
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
// theme = _.omitBy(theme, _.isFunction);
theme = _.omitBy(theme, (v, k) => keysToOmit.some((str) => k.includes(str)));
theme = _.omit(theme, subKeysToOmit);
// theme = _.merge(theme, theme.colors);
// delete theme.colors;

// write to files
console.log('successfully wrote:');
Object.entries(categories).forEach(([category, properties]) => {
  const data = _.pick(theme, properties);
  // console.log(category, data)
  makeFile(category, data);
});

// write index file
let indexFileData = '';
Object.keys(categories).forEach((category) => {
  indexFileData += `@import '${category}';\n`;
});
makeFile('index', indexFileData);
