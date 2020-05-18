const _ = require("lodash");
const { theme } = require("../stubs/defaultConfig.stub");

function resolveObject(name, obj) {
  res = `$${name}: (\n`;

  Object.entries(obj).forEach(([k, v], idx) => {
    const val = v.includes(", ") || _.isArray(v) ? `(${v})` : v;
    const key = k.includes("/") ? `"${k}"` : k;
    res += `  ${key}: ${val},\n`;
  });

  return res + ");";
}

function resolveArray(name, lst) {
  return `$${name}: (${lst.join(", ")});`;
}

function resolveTheme(str) {
  const searchFor = "theme(";
  str = str.substring(str.indexOf(searchFor) + searchFor.length + 1);
  str = str.substring(0, str.indexOf("'"));
  return theme[str];
}

function resolveFunction(name, value) {
  // first convert the function to a string and get everything after the =>
  const fnString = value.toString();
  let objString = fnString.substring(fnString.indexOf("=>") + 3).trim();

  // lets see if we can resolve the theme
  const themeObj = resolveTheme(objString);

  // filter out the trailing parens/curly braces
  if (objString[0] === "(" && objString[objString.length - 1] === ")") {
    objString = objString.substring(1, objString.length - 1);
    if (objString[0] == "{") {
      objString = objString.substring(1);
    }
    if (objString[objString.length - 1] === "}") {
      objString = objString.substring(0, objString.length - 1);
    }
    if (objString[objString.length - 1] === ",") {
      objString = objString.substring(0, objString.length - 1);
    }
  }

  // at this point the string should look like a set of key,value pairs
  // separated by commas

  // now we convert this string into an array of key,value pairs
  objString = objString
    .replace(/\s+/g, "")
    .replace(/\.\.\..*\'\),?/gm, "")
    .split(/,(?=(?:(?:[^\']*\'){2})*[^\']*$)/)
    .filter((s) => !_.isEmpty(s));

  let objToProcess = {};

  // now go through the list of strings and convert them into
  // an object one by one.
  objString.forEach((s) => {
    let [k, v] = s.split(":");
    if (k && v) {
      const removeQuotes = /["']/g;
      v = v.replace(removeQuotes, "");
      k = k.replace(removeQuotes, "");
      objToProcess = {
        ...objToProcess,
        [k]: v,
      };
    }
  });

  // append the theme object if available
  if (themeObj) {
    objToProcess = {
      ...objToProcess,
      ...themeObj,
    };
  }

  if (objToProcess) {
    return resolveObject(name, objToProcess);
  } else {
    // we didn't gather anything useful from this
    throw Error(`function ${value} resolved to undefined`);
  }
}

function resolve(name, value) {
  if (_.isFunction(value)) {
    return resolveFunction(name, value);
  } else if (_.isObject(value)) {
    return resolveObject(name, value);
  } else if (_.isArray(value)) {
    return resolveArray(name, value);
  } else {
    return `$${name}: ${value};`;
  }
}

module.exports = resolve;