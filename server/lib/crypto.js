/* @flow */

import crypto from "crypto";
import qs from "querystring";

const algorithm = "aes-128-cbc";

/**
 * Encrypts the given object with AES-128-CBC algorithm.
 *
 * @export
 * @param {any} obj The object or string to encrypt.
 * @param {any} password The password to use for the cipher.
 * @returns {string} An encrypted string.
 */
export function encrypt(obj: any, password: any): string {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(qs.stringify(obj), "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
}

/**
 * Decrypts the given string using AES-128-CBC algorithm.
 *
 * @export
 * @param {string} text The string the decrypt.
 * @param {any} password The password to use for the cipher.
 * @returns {any} A decrypted object or string.
 */
export function decrypt(text: string, password: any): any {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(text), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
}

/**
 * Express middleware function to decrypt the configuration send via
 * query parameters.
 *
 * @export
 * @param {any} password The password to use for decryption.
 * @returns {any} An express middleware function.
 */
export function middleware(password: any): any {
  return (req, res, next) => {
    if (req.query.conf) {
      req.hull = req.hull || {};
      req.hull.config = decrypt(req.query.conf, password);
    }
    next();
  };
}
