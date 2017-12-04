/**
 * This file is part of the simple-svg-cdn package.
 *
 * (c) Vjacheslav Trushkin <cyberalien@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

/**
 * Unique id counter
 *
 * @type {number}
 */
let idCounter = 0;

/**
 * Replace IDs in SVG output with unique IDs
 * Fast replacement without parsing XML, assuming commonly used patterns.
 *
 * @param {string} body
 * @return {string}
 */
module.exports = body => {
    let regex = /\sid="(\S+)"/g,
        ids = [],
        match, prefix;

    function strReplace(search, replace, subject) {
        let pos = 0;

        while ((pos = subject.indexOf(search, pos)) !== -1) {
            subject = subject.slice(0, pos) + replace + subject.slice(pos + search.length);
            pos += replace.length;
        }

        return subject;
    }

    // Find all IDs
    while (match = regex.exec(body)) {
        ids.push(match[1]);
    }
    if (!ids.length) {
        return body;
    }

    prefix = 'SimpleSVGId-' + Date.now().toString(16) + '-' + (Math.random() * 0x1000000 | 0).toString(16) + '-';

    // Replace with unique ids
    ids.forEach(function(id) {
        let newID = prefix + idCounter;
        idCounter ++;
        body = strReplace('="' + id + '"', '="' + newID + '"', body);
        body = strReplace('="#' + id + '"', '="#' + newID + '"', body);
        body = strReplace('(#' + id + ')', '(#' + newID + ')', body);
    });

    return body;
};
