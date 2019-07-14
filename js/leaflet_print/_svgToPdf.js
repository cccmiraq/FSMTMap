/*
 * svgToPdf.js
 *
 * Copyright 2012 Florian Hülsmann <fh@cbix.de>
 * Updated in 2013 by Datascope Analytics <info@datascopeanalytics.com>
 * This script is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This script is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this file.  If not, see <http://www.gnu.org/licenses/>.
 */

//   g: ['stroke', 'fill', 'stroke-width'],
//   line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'fill'],
//   rect: ['x', 'y', 'width', 'height', 'stroke', 'fill', 'stroke-width'],
//   ellipse: ['cx', 'cy', 'rx', 'ry', 'stroke', 'fill', 'stroke-width'],
//   circle: ['cx', 'cy', 'r', 'stroke', 'fill', 'stroke-width'],
//   text: ['x', 'y', 'font-size', 'font-family', 'text-anchor', 'font-weight', 'font-style', 'fill'],
//   path: []

function Color(str) {
  this.r = 255;
  this.g = 128;
  this.b = 0;
  this.a = 1;
  this.ok = true;
}

var SVG = {};

// TODO: get bbox

(function() {

  SVG.toPDF = function(node, pdf, options) {
    this.pdf = pdf;
    options = options || {};
    this.scale = options.scale || 1.0;
    this.x = options.offsetX === undefined ? 0 : options.offsetX;
    this.y = options.offsetY === undefined ? 0 : options.offsetY;

    // var
    //   offsetX = 0,
    //   offsetY = 0,
    //   w = 0,
    //   h = 0,
    //   scale = 1;
    //
    // if (svg.hasAttribute('viewBox')) {
    //   var viewbox = svg.getAttribute('viewBox').split(',');
    //   offsetX = parseFloat(viewBox[0]);
    //   offsetY = parseFloat(viewBox[1]);
    //   w = parseFloat(viewBox[2]);
    //   h = parseFloat(viewBox[3]);
    // } else {
    //   offsetX = parseFloat(svg.getAttribute('x'));
    //   offsetY = parseFloat(svg.getAttribute('y'));
    //   w = parseFloat(svg.getAttribute('width'));
    //   h = parseFloat(svg.getAttribute('height'));
    // }


    this.colorMode = null;
    this.processNode(node);
  };

  SVG.toPDF.prototype.processNode = function(parent) {
    var node;

    for (var i = 0; i<parent.children.length; i++) {
      node = parent.children[i];

      if (node.tagName === 'g') {
        this.addTransform(node);
      }

      this.setColorMode(node);

      switch (node.tagName) {
        case 'line':
          this.addLine(node);
          break;
        case 'rect':
          this.addRectangle(node);
          break;
        case 'ellipse':
          this.addEllipse(node);
          break;
        case 'circle':
          this.addCircle(node);
          break;
        case 'text':
          this.addText(node);
          break;
        case 'path':
          this.addPath(node);
          break;
      }
    }
  };

  SVG.toPDF.prototype.addTransform = function(node) {
    if (!node.hasAttribute('transform')) {
      this.processNode(node);
      return;
    }

    var matrix = node.getAttribute('transform').replace(/,/g, ' ').replace('matrix(', '').replace(')', ' cm');
    this.pdf.internal.write('q');
    this.pdf.internal.write(matrix);
    this.processNode(node);
    this.pdf.internal.write('Q');
  };

  SVG.toPDF.prototype.setColorMode = function(node) {
    var hasFillColor = false, fillRGB, strokeRGB;

    if (node.hasAttribute('fill') && ['g', 'line', 'rect', 'ellipse', 'circle', 'text', 'path'].indexOf(node.tagName)> -1) {
      fillRGB = new Color(node.getAttribute('fill'));
      if (fillRGB.ok) {
        hasFillColor = true;
        this.colorMode = 'F';
      } else {
        this.colorMode = null;
      }
    }

    if (hasFillColor) {
      this.pdf.setFillColor(fillRGB.r, fillRGB.g, fillRGB.b);
    }

    if (node.hasAttribute('stroke') && node.getAttribute('stroke') !== 'none') {
      strokeRGB = new Color(node.getAttribute('stroke'));
      if (strokeRGB.ok) {
        this.pdf.setDrawColor(strokeRGB.r, strokeRGB.g, strokeRGB.b);
        if (this.colorMode === 'F') {
          this.colorMode = 'FD';
        } else {
          this.colorMode = 'S';
        }
      } else {
        this.colorMode = null;
      }
    }
  };

  SVG.toPDF.prototype.addLine = function(node) {
    this.pdf.line(
      (parseFloat(node.getAttribute('x1')) + this.x)*this.scale,
      (parseFloat(node.getAttribute('y1')) + this.y)*this.scale,
      (parseFloat(node.getAttribute('x2')) + this.x)*this.scale,
      (parseFloat(node.getAttribute('y2')) + this.y)*this.scale
    );
  };

  SVG.toPDF.prototype.addRectangle = function(node) {
    this.pdf.rect(
      (parseFloat(node.getAttribute('x')) + this.x)*this.scale,
      (parseFloat(node.getAttribute('y')) + this.y)*this.scale,
      parseFloat(node.getAttribute('width'))*this.scale,
      parseFloat(node.getAttribute('height'))*this.scale,
      this.colorMode
    );
  };

  SVG.toPDF.prototype.addEllipse = function(node) {
    this.pdf.ellipse(
      (parseFloat(node.getAttribute('cx')) + this.x)*this.scale,
      (parseFloat(node.getAttribute('cy')) + this.y)*this.scale,
      parseFloat(node.getAttribute('rx'))*this.scale,
      parseFloat(node.getAttribute('ry'))*this.scale,
      this.colorMode
    );
  };

  SVG.toPDF.prototype.addCircle = function(node) {
    this.pdf.circle(
      (parseFloat(node.getAttribute('cx')) + this.x)*this.scale,
      (parseFloat(node.getAttribute('cy')) + this.y)*this.scale,
      parseFloat(node.getAttribute('r'))*this.scale,
      this.colorMode
    );
  };

  SVG.toPDF.prototype.addText = function(node) {
    var fontFamily = 'helvetica';

    if (node.hasAttribute('font-family')) {
      switch (node.getAttribute('font-family').toLowerCase().split(',')[0]) {
        case 'times':
          fontFamily = 'times';
          break;
        case 'courier':
          fontFamily = 'courier';
          break;
      }
    }

    this.pdf.setFont(fontFamily);

    // if (colorMode !== 'FD' || colorMode !== 'F') {
    //   this.pdf.setTextColor(fillRGB.r, fillRGB.g, fillRGB.b);
    // }

    var fontType = 'normal';
    if (node.hasAttribute('font-weight') && node.getAttribute('font-weight') === 'bold') {
      fontType = 'bold';
    }

    if (node.hasAttribute('font-style') && node.getAttribute('font-style') === 'italic') {
      fontType += 'italic';
    }

    this.pdf.setFontType(fontType);

    var pdfFontSize = 9;
    if (node.hasAttribute('font-size')) {
      pdfFontSize = parseFloat(node.getAttribute('font-size'));
    }

    var fontMetrics = this.pdf.internal.getFont(fontFamily, fontType).metadata.Unicode;

    var nodeText = node.innerText;
    var textWidth = this.pdf.getStringUnitWidth(nodeText, fontMetrics)*pdfFontSize;

    // TODO: use more accurate positioning

    var alignOffset = 0;

    switch (node.getAttribute('text-anchor')) {
      case 'end':
        break;
      case 'middle':
        alignOffset = textWidth/2;
        break;
      case 'start':
        alignOffset = 0;
        break;
    }

    var textX = parseFloat(node.getAttribute('x')) + this.x - alignOffset;
    var textY = parseFloat(node.getAttribute('y')) + this.y;

    this.pdf.setFontSize(pdfFontSize).text(textX*this.scale, textY*this.scale, nodeText);
  };

  SVG.toPDF.prototype.addPath = function(node) {
    var d = node.getAttribute('d');
    // Separate the svg 'd' string to a list of letter
    // and number elements. Iterate on this list.
    // console.log('path before',path);
    var rx = /(m|l|h|v|c|s|a|z)/gi;

    d = d.replace(/(e)?-/g, function($0, $1) {
      return $1 ? $0 : ' -';
    })
    // .replace(/-/g, ' -')
      .replace(rx, ' $1 ')
      .replace(/,+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .split(/[\s]+/);

    var command = null;
    var i = 0;

    // starting points for m/M
    var startX = null;
    var startY = null;

    // x and y will redefine the starting points
    var x = null;
    var y = null;

    // big list contains the large list of lists to pass to jspdf to render the appropriate path
    var bigList = [];

    // for S/s shorthand bezier calculations of 2nd control pts
    var previous_element = {
      element: null,
      prev_numbers: [],
      point: []
    };

    var numbers;
    var sci_regex = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/;

    // Go through our list until we are done with the path
    while (i<d.length) {
      i++;

      // Numbers will hold the list of numbers for the appropriate path
      numbers = [];

      // command is a letter corresponding to the type of path to draw
      command = d[i];
      if (sci_regex.test(command)) {
        command = String(Number(command));
      }

      //if command is s/S, need to find 1st control pts
      if (/s/i.test(command)) {
        previous_element.point = find_s_points(previous_element);
      }

      // for some reason z followed by another letter
      // i.e. 'z m' skips that 2nd letter, so added if
      // statement to get around that.
      if (/z/i.test(command) === false) {
        // Parse through the path until we find the next letter or we are at the end of the path
        while ((rx.test(d[i]) === false) && (i !== d.length)) {
          numbers.push(this.scale*parseFloat(d[i]));
          i++;
        }
      }

      switch (command) {
        case 'm':
          if (bigList.length > 0) {
            this.pdf.lines(bigList, startX, startY, [1, 1], null);
            bigList = [];
          }

          // check if this is 1st command in the path
          if (previous_element.element === null) {
            x = numbers[0];
            y = numbers[1];
            startX = numbers[0];
            startY = numbers[1];
          } else {
            x += numbers[0];
            y += numbers[1];
            startX += numbers[0];
            startY += numbers[1];
          }

          if (numbers.length != 2) {
            var lines_numbers = numbers.slice(2, numbers.length);
            var newNumbers = change_numbers(lines_numbers, x, y, true);
            newNumbers.map(function(num) {
              bigList.push(num);
            });
            // pdf.lines(newNumbers,x,y,[1,1],null);
            x += sums(newNumbers, true);
            y += sums(newNumbers, false);
          }
          break;

        case 'M':
          if (bigList.length > 0) {
            this.pdf.lines(bigList, startX, startY, [1, 1], null);
            bigList = [];
          }

          x = numbers[0];
          y = numbers[1];
          startX = numbers[0] + this.x;
          startY = numbers[1] + this.y;

          if (numbers.length != 2) {
            x = numbers[0];
            y = numbers[1];
            var lines_numbers = numbers.slice(2, numbers.length);
            var newNumbers = change_numbers(lines_numbers, x, y, false);
            this.pdf.lines(newNumbers, x, y, [1, 1], null);
            x += newNumbers[newNumbers.length - 1][0];
            y += newNumbers[newNumbers.length - 1][1];
          }
          break;

        case 'l':
          var newNumbers = change_numbers(numbers, x, y, true);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines(newNumbers,x,y,[1,1],null);
          x += sums(newNumbers, true);
          y += sums(newNumbers, false);
          break;

        case 'L':
          var newNumbers = change_numbers(numbers, x, y, false);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          //this.pdf.lines(newNumbers,x,y,[1,1],null);
          x += newNumbers[newNumbers.length - 1][0];
          y += newNumbers[newNumbers.length - 1][1];
          break;

        case 'h':
          // x does not change. Only y changes
          var sum = numbers.reduce(function(memo, num) {
            return memo + num;
          }, 0);

          var newNumbers = [
            [sum, 0]
          ];
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines([[sum,0]],x,y,[1,1],null);
          x += sum;
          break;

        case 'H':
          bigList.push([numbers[numbers.length - 1] - x, 0]);
          // this.pdf.lines([[numbers[numbers.length-1]-x,0]], x,y,[1,1],null);
          x = numbers[numbers.length - 1];
          break;

        case 'v':
          var sum = numbers.reduce(function(memo, num) {
            return memo + num;
          }, 0);
          var newNumbers = [
            [0, sum]
          ];
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines([[0,sum]],x,y,[1,1],null);
          y += sum;
          break;

        case 'V':
          bigList.push([0, numbers[numbers.length - 1] - y]);
          // this.pdf.lines([[0,numbers[numbers.length-1]-y]], x,y,[1,1],null);
          y = numbers[numbers.length - 1];
          break;

        case 'c':
          var newNumbers = bezier_numbers(numbers, x, y, true);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines(newNumbers,x,y,[1,1],null);
          x += sums(newNumbers, true);
          y += sums(newNumbers, false);
          break;

        case 'C':
          var newNumbers = bezier_numbers(numbers, x, y, false);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines(newNumbers,x,y,[1,1],null);
          x = numbers[numbers.length - 2];
          y = numbers[numbers.length - 1];
          break;

        case 's':
          var newNumbers = s_bezier_numbers(numbers, x, y, true, previous_element);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines(newNumbers,x,y,[1,1],null);
          x += sums(newNumbers, true);
          y += sums(newNumbers, false);
          break;

        case 'S':
          var newNumbers = s_bezier_numbers(numbers, x, y, false, previous_element);
          newNumbers.map(function(num) {
            bigList.push(num);
          });
          // this.pdf.lines(newNumbers,x,y,[1,1],null);
          x = numbers[numbers.length - 2];
          y = numbers[numbers.length - 1];
          break;

        case 'A':
          break;

        case 'a':
          break;

        case 'z':
          bigList.push([startX - x, startY - y]);
          x = startX;
          y = startY;
          // this.pdf.lines([[startX-x,startY-y]],x,y,[1,1],null);
          break;

        case 'Z':
          bigList.push([startX - x, startY - y]);
          x = startX;
          y = startY;
          // this.pdf.lines([[startX-x,startY-y]],x,y,[1,1],null);
          break;
      }

      previous_element.element = command;
      previous_element.prev_numbers = numbers;
    }

    this.pdf.lines(bigList, startX, startY, [1, 1], this.colorMode);
  };
}());

function sums(ListOfLists, is_x) {
  if (is_x) {
    var sum = ListOfLists.reduce(function(memo, num) {
      return memo + num[num.length - 2];
    }, 0);
  } else {
    var sum = ListOfLists.reduce(function(memo, num) {
      return memo + num[num.length - 1];
    }, 0);
  }
  return sum;
}

function change_numbers(numbers, x, y, relative) {
  var i = 0;
  var prev_x = x;
  var prev_y = y;
  var newNumbers = [];
  while (i<numbers.length) {
    if (relative) {
      x = numbers[i];
      y = numbers[i + 1];
    } else {
      x = numbers[i] - prev_x;
      y = numbers[i + 1] - prev_y;
    }
    prev_x = numbers[i];
    prev_y = numbers[i + 1];
    newNumbers.push([x, y]);
    i += 2;
  }
  return newNumbers;
}

function bezier_numbers(numbers, x, y, relative) {
  // the bezier numbers are ALL relative to the
  // previous case line's (x,y), not all relative to
  // each other.
  var i = 0;
  var prev_x = x;
  var prev_y = y;
  var newNumbers = [];
  while (i<numbers.length) {
    if (relative) {
      var numbers_to_push = numbers.slice(i, i + 6);
    } else {
      var numbers_to_push = [];
      for (var k = i; k<i + 6; k = k + 2) {
        numbers_to_push.push(
          numbers[k] - prev_x,
          numbers[k + 1] - prev_y);
      }
    }
    prev_x = numbers[i + 4];
    prev_y = numbers[i + 5];
    newNumbers.push(numbers_to_push);
    i += 6;
  }
  return newNumbers;
}

function s_bezier_numbers(numbers, x, y, relative, previous_element) {
  var i = 0;
  var prev_x = x;
  var prev_y = y;
  var newNumbers = [];
  while (i<numbers.length) {
    var numbers_to_push = [];
    //need to check if relative for the 4 s/S numbers
    if (relative) {
      //find that 1st control point
      if (i<4 && (previous_element.element == 'c' || previous_element.element == 's')) {
        // case 1: there was a prev c/C/s/S
        // outside this numbers segment
        numbers_to_push.push(previous_element.point[0],
          previous_element.point[1]);
      } else if (i>=4) {
        //case 1: there was a prev s/S
        //within this numbers segment
        numbers_to_push.push(numbers[i - 2] - numbers[i - 4],
          numbers[i - 1] - numbers[i - 3]);
      } else {
        // case 2: no prev c/C/s/S, therefore
        // 1st control pt = current pt.
        numbers_to_push.push(prev_x, prev_y);
      }
      //then add the rest of the s numbers
      for (var k = i; k<i + 4; k++) {
        numbers_to_push.push(numbers[k]);
      }
    } else {
      //find that 1st control point
      if (i<4 && (previous_element.element == 'C' || previous_element.element == 'S')) {
        // case 1: there was a prev c/C/s/S
        // outside this numbers segment
        numbers_to_push.push(previous_element.point[0] - prev_x,
          previous_element.point[1] - prev_y);
      } else if (i>=4) {
        //case 1: there was a prev s/S
        //within this numbers segment
        numbers_to_push.push(numbers[i - 2] + numbers[i - 2] - numbers[i - 4],
          numbers[i - 1] + numbers[i - 1] - numbers[i - 3]);
      } else {
        // case 2: no prev c/C/s/S, therefore
        // 1st control pt = current pt.
        numbers_to_push.push(prev_x, prev_y);
      }
      //then add the rest of the s numbers
      for (var k = i; k<i + 4; k = k + 2) {
        numbers_to_push.push(numbers[k] - prev_x);
        numbers_to_push.push(numbers[k + 1] - prev_y);
      }
    }

    prev_x = numbers[i + 2];
    prev_y = numbers[i + 3];

    newNumbers.push(numbers_to_push);
    i += 4;
  }
  return newNumbers;
}

function find_s_points(previous_element) {
  var numbs;
  if (/(s|c)/.test(previous_element.element)) {
    numbs = previous_element.prev_numbers;
    previous_element.point = [numbs[numbs.length - 2] - numbs[numbs.length - 4],
      numbs[numbs.length - 1] - numbs[numbs.length - 3]];
  } else if (/(S|C)/.test(previous_element.element)) {
    numbs = previous_element.prev_numbers;
    previous_element.point = [2*numbs[numbs.length - 2] - numbs[numbs.length - 4],
      2*numbs[numbs.length - 1] - numbs[numbs.length - 3]];
  }
  return previous_element.point
}
