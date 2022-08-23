import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../util/util"

export const BigDecimalScalar = new GraphQLScalarType({
  name: 'BigDecimal',
  description: 'Big number decimal',
  serialize(value: string | number) {
    return parse(String(value))
  },
  parseValue(value: string) {
    if (!isDecimal(value)) throw invalidFormat('BigDecimal', value)
    return value
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case "StringValue":
        if (isDecimal(ast.value)) {
          return parse(ast.value)
        } else {
          throw invalidFormat('BigDecimal', ast.value)
        }
      case "FloatValue":
        return parse(ast.value)
      default:
        return null
    }
  }
})


function isDecimal(s: string): boolean {
  return /^[+\-]?\d+\.?(\d+)?(e-\d+)?$/.test(s)
}


type BigDecimal = {s: number, e: number, c: number[]}


// from big.js
function parse(n: string) {
  var e, i, nl;

  let x: BigDecimal = {s: 0, e: 0, c: []}

  // Determine sign.
  if (n.charAt(0) == '-') {
    x.s = (n = n.slice(1), -1)
  } else if (n.charAt(0) == '+') {
    x.s = (n = n.slice(1), 1)
  } else {
    x.s = 1
  }

  // Decimal point?
  if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

  // Exponential form?
  if ((i = n.search(/e/i)) > 0) {

    // Determine exponent.
    if (e < 0) e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {

    // Integer.
    e = n.length;
  }

  nl = n.length;

  // Determine leading zeros.
  for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

  if (i == nl) {

    // Zero.
    x.c = [x.e = 0];
  } else {

    // Determine trailing zeros.
    for (; nl > 0 && n.charAt(--nl) == '0';);
    x.e = e - i - 1;
    x.c = [];

    // Convert string to array of digits without leading/trailing zeros.
    for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
  }

  return stringify(x);
}


function stringify(x: BigDecimal): string {
  let e = x.e
  let s = x.c.join('')
  let n = s.length;

  if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) {
      for (e -= n; e--;) s += '0';
    } else if (e < n) {
      s = s.slice(0, e) + '.' + s.slice(e);
    }
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }

  return x.s < 0 ? '-' + s : s;
}
