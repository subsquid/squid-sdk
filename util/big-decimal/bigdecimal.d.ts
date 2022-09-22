// Type definitions for big.js 6.1
// Project: https://github.com/MikeMcl/big.js/
// Definitions by: Steve Ognibene <https://github.com/nycdotnet>
//                 Roman Nuritdinov (Ky6uk) <https://github.com/Ky6uk>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
export type BigDecimalSource = number | bigint | string | BigDecimal;

// eslint-disable-next-line no-const-enum
export const enum Comparison {
    /**
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use > 0 instead.
     */
    GT = 1,
    /**
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use 0 instead.
     */
    EQ = 0,
    /**
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use < 0 instead.
     */
    LT = -1,
}

// eslint-disable-next-line no-const-enum
export const enum RoundingMode {
    /**
     * Rounds towards zero.
     * I.e. truncate, no rounding.
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use 0 or BigDecimal.roundDown instead.
     */
    RoundDown = 0,
    /**
     * Rounds towards nearest neighbour.
     * If equidistant, rounds away from zero.
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use 1 or BigDecimal.roundHalfUp instead.
     */
    RoundHalfUp = 1,
    /**
     * Rounds towards nearest neighbour.
     * If equidistant, rounds towards even neighbour.
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use 2 or BigDecimal.roundHalfEven instead.
     */
    RoundHalfEven = 2,
    /**
     * Rounds away from zero.
     * @deprecated Const enums cannot be used by JavaScript consumers or with single-file transpilation, i.e. isolatedModules
     * {@link https://github.com/microsoft/DefinitelyTyped-tools/blob/master/packages/dtslint/docs/no-const-enum.md}.
     * Use 3 or BigDecimal.roundUp instead.
     */
    RoundUp = 3,
}

export interface BigDecimalConstructor {
    /**
     * Returns a new instance of a BigDecimal number object
     *
     * String values may be in exponential, as well as normal (non-exponential) notation.
     * There is no limit to the number of digits of a string value (other than that of Javascript's maximum array size), but the largest recommended exponent magnitude is 1e+6.
     * Infinity, NaN and hexadecimal literal strings, e.g. '0xff', are not valid.
     * String values in octal literal form will be interpreted as decimals, e.g. '011' is 11, not 9.
     *
     * @throws `NaN` on an invalid value.
     */
    (value: BigDecimalSource): BigDecimal;
    (value: BigDecimalSource, decimals: number | bigint): BigDecimal;

    isBigDecimal(value: unknown): value is BigDecimal;
}

export interface BigDecimal {
    /** Returns a BigDecimal number whose value is the absolute value, i.e. the magnitude, of this BigDecimal number. */
    abs(): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number plus n - alias for .plus().
     *
     * @throws `NaN` if n is invalid.
     */
    add(n: BigDecimalSource): BigDecimal;
    /**
     * Compare the values.
     *
     * @throws `NaN` if n is invalid.
     */
    cmp(n: BigDecimalSource): Comparison;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number divided by n.
     *
     * If the result has more fraction digits than is specified by BigDecimal.DP, it will be rounded to BigDecimal.DP decimal places using rounding mode BigDecimal.RM.
     *
     * @throws `NaN` if n is invalid.
     * @throws `±Infinity` on division by zero.
     * @throws `NaN` on division of zero by zero.
     */
    div(n: BigDecimalSource): BigDecimal;
    /**
     * Returns true if the value of this BigDecimal equals the value of n, otherwise returns false.
     *
     * @throws `NaN` if n is invalid.
     */
    eq(n: BigDecimalSource): boolean;
    /**
     * Returns true if the value of this BigDecimal is greater than the value of n, otherwise returns false.
     *
     * @throws `NaN` if n is invalid.
     */
    gt(n: BigDecimalSource): boolean;
    /**
     * Returns true if the value of this BigDecimal is greater than or equal to the value of n, otherwise returns false.
     *
     * @throws `NaN` if n is invalid.
     */
    gte(n: BigDecimalSource): boolean;
    /**
     * Returns true if the value of this BigDecimal is less than the value of n, otherwise returns false.
     *
     * @throws `NaN` if n is invalid.
     */
    lt(n: BigDecimalSource): boolean;
    /**
     * Returns true if the value of this BigDecimal is less than or equal to the value of n, otherwise returns false.
     *
     * @throws `NaN` if n is invalid.
     */
    lte(n: BigDecimalSource): boolean;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number minus n.
     *
     * @throws `NaN` if n is invalid.
     */
    minus(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number modulo n, i.e. the integer remainder of dividing this BigDecimal number by n.
     *
     * The result will have the same sign as this BigDecimal number, and it will match that of Javascript's % operator (within the limits of its precision) and BigDecimalDecimal's remainder method.
     *
     * @throws `NaN` if n is negative or otherwise invalid.
     */
    mod(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number times n - alias for .times().
     *
     * @throws `NaN` if n is invalid.
     */
    mul(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number plus n.
     *
     * @throws `NaN` if n is invalid.
     */
    plus(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number raised to the power exp.
     *
     * If exp is negative and the result has more fraction digits than is specified by BigDecimal.DP, it will be rounded to BigDecimal.DP decimal places using rounding mode BigDecimal.RM.
     *
     * @param exp The power to raise the number to, -1e+6 to 1e+6 inclusive
     * @throws `!pow!` if exp is invalid.
     *
     * Note: High value exponents may cause this method to be slow to return.
     */
    pow(exp: number): BigDecimal;
    /**
     * Return a new BigDecimal whose value is the value of this BigDecimal rounded to a maximum precision of sd
     * significant digits using rounding mode rm, or BigDecimal.RM if rm is not specified.
     *
     * @param sd Significant digits: integer, 1 to MAX_DP inclusive.
     * @param rm Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
     * @throws `!prec!` if sd is invalid.
     * @throws `!BigDecimal.RM!` if rm is invalid.
     */
    prec(sd: number, rm?: RoundingMode): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number rounded using rounding mode rm to a maximum of dp decimal places.
     *
     * @param dp Decimal places, 0 to 1e+6 inclusive
     * @param rm Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
     * @throws `!round!` if dp is invalid.
     * @throws `!BigDecimal.RM!` if rm is invalid.
     */
    round(dp?: number, rm?: RoundingMode): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the square root of this BigDecimal number.
     *
     * If the result has more fraction digits than is specified by BigDecimal.DP, it will be rounded to BigDecimal.DP decimal places using rounding mode BigDecimal.RM.
     *
     * @throws `NaN` if this BigDecimal number is negative.
     */
    sqrt(): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number minus n - alias for .minus().
     *
     * @throws `NaN` if n is invalid.
     */
    sub(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a BigDecimal number whose value is the value of this BigDecimal number times n.
     *
     * @throws `NaN` if n is invalid.
     */
    times(n: BigDecimalSource): BigDecimal;
    /**
     * Returns a string representing the value of this BigDecimal number in exponential notation to a fixed number of decimal places dp.
     *
     * If the value of this BigDecimal number in exponential notation has more digits to the right of the decimal point than is specified by dp,
     * the return value will be rounded to dp decimal places using rounding mode BigDecimal.RM.
     *
     * If the value of this BigDecimal number in exponential notation has fewer digits to the right of the decimal point than is specified by dp, the return value will be appended with zeros accordingly.
     *
     * If dp is omitted, or is null or undefined, the number of digits after the decimal point defaults to the minimum number of digits necessary to represent the value exactly.
     *
     * @param dp Decimal places, 0 to 1e+6 inclusive
     * @param rm Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
     * @throws `!toFix!` if dp is invalid.
     */
    toExponential(dp?: number, rm?: RoundingMode): string;
    /**
     * Returns a string representing the value of this BigDecimal number in normal notation to a fixed number of decimal places dp.
     *
     * If the value of this BigDecimal number in normal notation has more digits to the right of the decimal point than is specified by dp,
     * the return value will be rounded to dp decimal places using rounding mode BigDecimal.RM.
     *
     * If the value of this BigDecimal number in normal notation has fewer fraction digits then is specified by dp, the return value will be appended with zeros accordingly.
     *
     * Unlike Number.prototype.toFixed, which returns exponential notation if a number is greater or equal to 1021, this method will always return normal notation.
     *
     * If dp is omitted, or is null or undefined, then the return value is simply the value in normal notation.
     * This is also unlike Number.prototype.toFixed, which returns the value to zero decimal places.
     *
     * @param dp Decimal places, 0 to 1e+6 inclusive
     * @param rm Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
     * @throws `!toFix!` if dp is invalid.
     */
    toFixed(dp?: number, rm?: RoundingMode): string;
    /**
     * Returns a string representing the value of this BigDecimal number to the specified number of significant digits sd.
     *
     * If the value of this BigDecimal number has more digits than is specified by sd, the return value will be rounded to sd significant digits using rounding mode BigDecimal.RM.
     *
     * If the value of this BigDecimal number has fewer digits than is specified by sd, the return value will be appended with zeros accordingly.
     *
     * If sd is less than the number of digits necessary to represent the integer part of the value in normal notation, then exponential notation is used.
     *
     * If sd is omitted, or is null or undefined, then the return value is the same as .toString().
     *
     * @param sd Significant digits, 1 to 1e+6 inclusive
     * @param rm Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
     * @throws `!toPre!` if sd is invalid.
     */
    toPrecision(sd?: number, rm?: RoundingMode): string;
    /**
     * Returns a string representing the value of this BigDecimal number.
     *
     * If this BigDecimal number has a positive exponent that is equal to or greater than 21, or a negative exponent equal to or less than -7, then exponential notation is returned.
     *
     * The point at which toString returns exponential rather than normal notation can be adjusted by changing
     * the value of BigDecimal.E_POS and BigDecimal.E_NEG. By default, BigDecimal numbers correspond to Javascript's number type in this regard.
     */
    toString(): string;
    /**
     * Returns a primitive number representing the value of this BigDecimal number.
     *
     * If BigDecimal.strict is true an error will be thrown if toNumber is called on a BigDecimal number which cannot be converted to a primitive number without a loss of precision.
     *
     * @since 6.0
     */
    toNumber(): number;
    /**
     * Returns a string representing the value of this BigDecimal number.
     *
     * If this BigDecimal number has a positive exponent that is equal to or greater than 21, or a negative exponent equal to or less than -7, then exponential notation is returned.
     *
     * The point at which toString returns exponential rather than normal notation can be adjusted by changing
     * the value of BigDecimal.E_POS and BigDecimal.E_NEG. By default, BigDecimal numbers correspond to Javascript's number type in this regard.
     */
    valueOf(): string;
    /**
     * Returns a string representing the value of this BigDecimal number.
     *
     * If this BigDecimal number has a positive exponent that is equal to or greater than 21, or a negative exponent equal to or less than -7, then exponential notation is returned.
     *
     * The point at which toString returns exponential rather than normal notation can be adjusted by changing
     * the value of BigDecimal.E_POS and BigDecimal.E_NEG. By default, BigDecimal numbers correspond to Javascript's number type in this regard.
     */
    toJSON(): string;
    /**
     * Returns an array of single digits
     */
    c: number[];
    /**
     * Returns the exponent, Integer, -1e+6 to 1e+6 inclusive
     */
    e: number;
    /**
     * Returns the sign, -1 or 1
     */
    s: number;
}

// We want the exported symbol 'BigDecimal' to represent two things:
// - The BigDecimal interface, when used in a type context.
// - The BigDecimalConstructor instance, when used in a value context.
export const BigDecimal: BigDecimalConstructor;
