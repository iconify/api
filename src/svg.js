"use strict";

const replaceIDs = require('./svg-ids');
const calculateDimension = require('./svg-dimensions');

/**
 * Get preserveAspectRatio attribute value
 *
 * @param {object} align
 * @return {string}
 * @private
 */
function _align(align) {
    let result;
    switch (align.horizontal) {
        case 'left':
            result = 'xMin';
            break;

        case 'right':
            result = 'xMax';
            break;

        default:
            result = 'xMid';
    }
    switch (align.vertical) {
        case 'top':
            result += 'YMin';
            break;

        case 'bottom':
            result += 'YMax';
            break;

        default:
            result += 'YMid';
    }
    result += align.slice ? ' slice' : ' meet';
    return result;
}

/**
 * Generate SVG
 *
 * @param {object} item Icon data
 * @param {object} props Query string
 * @returns {string}
 */
module.exports = (item, props) => {
    // Set data
    let align = {
        horizontal: 'center',
        vertical: 'middle',
        slice: false
    };
    let transform = {
        rotate: item.rotate,
        hFlip: item.hFlip,
        vFlip: item.vFlip
    };
    let style = '';

    let attributes = {};

    // Get width/height
    let inline = props.inline === true || props.inline === 'true' || props.inline === '1';

    let box = {
        left: item.left,
        top: inline ? item.inlineTop : item.top,
        width: item.width,
        height: inline ? item.inlineHeight : item.height
    };

    // Transformations
    ['hFlip', 'vFlip'].forEach(key => {
        if (props[key] !== void 0 && (props[key] === true || props[key] === 'true' || props[key] === '1')) {
            transform[key] = !transform[key];
        }
    });
    if (props.flip !== void 0) {
        props.flip.toLowerCase().split(/[\s,]+/).forEach(value => {
            switch (value) {
                case 'horizontal':
                    transform.hFlip = !transform.hFlip;
                    break;

                case 'vertical':
                    transform.vFlip = !transform.vFlip;
            }
        });
    }
    if (props.rotate !== void 0) {
        let value = props.rotate;
        if (typeof value === 'number') {
            transform.rotate += value;
        } else if (typeof value === 'string') {
            let units = value.replace(/^-?[0-9.]*/, '');
            if (units === '') {
                value = parseInt(value);
                if (!isNaN(value)) {
                    transform.rotate += value;
                }
            } else if (units !== value) {
                let split = false;
                switch (units) {
                    case '%':
                        // 25% -> 1, 50% -> 2, ...
                        split = 25;
                        break;

                    case 'deg':
                        // 90deg -> 1, 180deg -> 2, ...
                        split = 90;
                }
                if (split) {
                    value = parseInt(value.slice(0, value.length - units.length));
                    if (!isNaN(value)) {
                        transform.rotate += Math.round(value / split);
                    }
                }
            }
        }
    }

    // Apply transformations to box
    let transformations = [],
        tempValue;
    if (transform.hFlip) {
        if (transform.vFlip) {
            transform.rotate += 2;
        } else {
            // Horizontal flip
            transformations.push('translate(' + (box.width + box.left) + ' ' + (0 - box.top) + ')');
            transformations.push('scale(-1 1)');
            box.top = box.left = 0;
        }
    } else if (transform.vFlip) {
        // Vertical flip
        transformations.push('translate(' + (0 - box.left) + ' ' + (box.height + box.top) + ')');
        transformations.push('scale(1 -1)');
        box.top = box.left = 0;
    }
    switch (transform.rotate % 4) {
        case 1:
            // 90deg
            tempValue = box.height / 2 + box.top;
            transformations.unshift('rotate(90 ' + tempValue + ' ' + tempValue + ')');
            // swap width/height and x/y
            if (box.left !== 0 || box.top !== 0) {
                tempValue = box.left;
                box.left = box.top;
                box.top = tempValue;
            }
            if (box.width !== box.height) {
                tempValue = box.width;
                box.width = box.height;
                box.height = tempValue;
            }
            break;

        case 2:
            // 180deg
            transformations.unshift('rotate(180 ' + (box.width / 2 + box.left) + ' ' + (box.height / 2 + box.top) + ')');
            break;

        case 3:
            // 270deg
            tempValue = box.width / 2 + box.left;
            transformations.unshift('rotate(-90 ' + tempValue + ' ' + tempValue + ')');
            // swap width/height and x/y
            if (box.left !== 0 || box.top !== 0) {
                tempValue = box.left;
                box.left = box.top;
                box.top = tempValue;
            }
            if (box.width !== box.height) {
                tempValue = box.width;
                box.width = box.height;
                box.height = tempValue;
            }
            break;
    }

    // Calculate dimensions
    // Values for width/height: null = default, 'auto' = from svg, false = do not set
    // Default: if both values aren't set, height defaults to '1em', width is calculated from height
    let customWidth = props.width ? props.width : null;
    let customHeight = props.height ? props.height : null;

    let width, height;
    if (customWidth === null && customHeight === null) {
        customHeight = '1em';
    }
    if (customWidth !== null && customHeight !== null) {
        width = customWidth;
        height = customHeight;
    } else if (customWidth !== null) {
        width = customWidth;
        height = calculateDimension(width, box.height / box.width);
    } else {
        height = customHeight;
        width = calculateDimension(height, box.width / box.height);
    }

    if (width !== false) {
        attributes.width = width === 'auto' ? box.width : width;
    }
    if (height !== false) {
        attributes.height = height === 'auto' ? box.height : height;
    }

    // Add vertical-align for inline icon
    if (inline && item.verticalAlign !== 0) {
        style += 'vertical-align: ' + item.verticalAlign + 'em;';
    }

    // Check custom alignment
    if (props.align !== void 0) {
        props.align.toLowerCase().split(/[\s,]+/).forEach(value => {
            switch (value) {
                case 'left':
                case 'right':
                case 'center':
                    align.horizontal = value;
                    break;

                case 'top':
                case 'bottom':
                case 'middle':
                    align.vertical = value;
                    break;

                case 'crop':
                    align.slice = true;
                    break;

                case 'meet':
                    align.slice = false;
            }
        });
    }

    // Add 360deg transformation to style to prevent subpixel rendering bug
    style += '-ms-transform: rotate(360deg); -webkit-transform: rotate(360deg); transform: rotate(360deg);';

    // Style attribute
    attributes.style = style;

    // Generate viewBox and preserveAspectRatio attributes
    attributes.preserveAspectRatio = _align(align);
    attributes.viewBox = box.left + ' ' + box.top + ' ' + box.width + ' ' + box.height;

    // Generate body
    let body = replaceIDs(item.body);

    if (props.color !== void 0) {
        body = body.replace(/currentColor/g, props.color);
    }
    if (transformations.length) {
        body = '<g transform="' + transformations.join(' ') + '">' + body + '</g>';
    }

    let svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
    Object.keys(attributes).forEach(attr => {
        svg += ' ' + attr + '="' + attributes[attr] + '"';
    });
    svg += '>' + body + '</svg>';

    return svg;
};
