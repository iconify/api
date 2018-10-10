"use strict";

module.exports = (list, callback) => new Promise((fulfill, reject) => {
    let results = [];

    function next() {
        let item = list.shift();
        if (item === void 0) {
            fulfill(results);
            return;
        }

        let promise = callback(item);
        if (promise === null) {
            // skip
            next();
            return;
        }
        promise.then(result => {
            results.push(result);
            next();
        }).catch(err => {
            reject(err);
        })
    }

    next();
});
