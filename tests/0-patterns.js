/* I created file not as a test so much as illustration and demonstration 
   (and confidence builder in the features) of ES6/7 programming features
   I want this code base to utilize. I find myself referring often to
   these examples to remember.
   
   https://babeljs.io/docs/en/learn
   
*/

import test from 'ava';
import { Element } from 'html-element';

// arrows, lexican this
test('arrow functions', t => {
    // Expression bodies
    let evens = [2, 4, 6, 8];
    let odds = evens.map(v => v + 1);
    let nums = evens.map((v, i) => v + i);
    t.is(odds[2], 7);
    
    // Statement bodies
    let fives = [];
    nums.forEach(v => {
      if (v % 5 === 0)
        fives.push(v);
    });
    t.is(fives.length, 1);
});

test('lexical this', t => {
    // Lexical arguments
    function square() {
        let example = () => {
            let numbers = [];
            for (let number of arguments) {
              numbers.push(number * number);
            }

            return numbers;
        };
        return example();
    }
    t.is(square(4)[0], 16);
});

// barebones promise
test('simple async example', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});

// unicode 

// new RegExp behaviour, opt-in ‘u’
test('unicode matching', t => {
    t.is("𠮷".match(/./u)[0].length, 2);
});

// new form
//  "\u{20BB7}" == "𠮷" == "\uD842\uDFB7"

// template strings
test('template strings', t => {
    // Multiline strings
    t.truthy(`In ES5 this is
    not legal.`.match(/\n/));

    // Interpolate variable bindings
    var name = "Bob", time = "today";
    var newstring = `Hello ${name}, how are you ${time}?`
    t.is(newstring, "Hello Bob, how are you today?");

    // Unescaped template strings
    var ustring = String.raw`In ES5 "\n" is a line-feed.`
    t.is(ustring, "In ES5 \"\\n\" is a line-feed.");
 
});

// destructuring
test('destructuring', t => {
    // list matching
    var [a, ,b] = [1,2,3];
    t.is(a, 1);
    t.is(b, 3);
    
    function getASTNode () { return { op: 12, lhs: { op: 24 }, rhs: 15 } };
    // object matching
    var { op: a, lhs: { op: b }, rhs: c } = getASTNode();
    t.is(a, 12);
    t.is(b, 24);
    t.is(c, 15);
        
    // object matching shorthand
    // binds `op`, `lhs` and `rhs` in scope
    var {op, lhs, rhs} = getASTNode();
    t.is(op, 12);
    t.is(lhs.op, 24);

    // Can be used in parameter position
    function g({name: x}) {
        t.is(x, 5);
    }
    g({name: 5})

    // Fail-soft destructuring (think object['prop'] not throwing..)
    var [a] = [];
    t.is(a, undefined);

    // Fail-soft destructuring with defaults
    var [a = 1] = [];
    t.is(a, 1);

    // Destructuring + defaults arguments
    function r({x, y, w = 10, h = 10}) {
      return x + y + w + h;
    }
    t.is( r({x:1, y:2}), 23 );
});

// defaults, rests, spreads

test('defaults', t => {
    function f(x, y=12) {
        // y is 12 if not passed (or passed as undefined)
        return x + y;
    }
    t.is(f(3), 15);
});
test('rest', t => {
    function f(x, ...y) {
    // y is an Array
        return x * y.length;
    }
    t.is(f(3, "hello", true), 6); 
});
test('spreads', t => {
    function f(x, y, z) {
        return x + y + z;
    }
    // Pass each elem of array as argument
    t.is(f(...[1,2,3]), 6);
});

// classes

class CatElement extends Element { // in brower would be HTMLElement
  constructor(geometry, materials) {
    super(geometry, materials);
    this.bones = [];
    this.boneMatrices = [];
    //...
  }
  update(camera) {
    //...
    super.update();
  }
  static defaultMatrix() {
    // return new THREE.Matrix4();
  }
}

test('classes', t => {
    let catel = new CatElement ();
    t.is(Object.getPrototypeOf(Object.getPrototypeOf(catel)).constructor.name, 'Node');
    t.is(Object.getPrototypeOf(catel).constructor.name, 'CatElement');
});

// subclassable built-ins (also Date, etc.)

test ('subclassed array', t => {
    class MyArray extends Array {
        constructor(...args) { super(...args); }
    }
    var arr = new MyArray();
    arr[1] = 12;
    t.is(arr.length, 2);
});

// modules
/*
// lib/math.js
export function sum(x, y) {
  return x + y;
}
export var pi = 3.141593;

// app.js
import * as math from "lib/math";
console.log("2π = " + math.sum(math.pi, math.pi));

// otherApp.js
import {sum, pi} from "lib/math";
console.log("2π = " + sum(pi, pi));

// lib/mathplusplus.js
export * from "lib/math";
export var e = 2.71828182846;
export default function(x) {
    return Math.exp(x);
}

// app.js
import exp, {pi, e} from "lib/mathplusplus";
console.log("e^π = " + exp(pi));

*/


// iterators
/*   signature/interface:
interface IteratorResult {
  done: boolean;
  value: any;
}
interface Iterator {
  next(): IteratorResult;
}
interface Iterable {
  [Symbol.iterator](): Iterator
}
*/

let fibonacci = {
  [Symbol.iterator]() {
    let pre = 0, cur = 1;
    return {
      next() {
        [pre, cur] = [cur, pre + cur];
        return { done: false, value: cur }
      }
    }
  }
}

test('iterators', t => {
    for (var n of fibonacci) {
    // truncate the sequence at 1000
        if (n > 1000)
            break;
    }
    t.is(n, 1597); // hoisting can be good :-)
});

// generators

var fibonacciG = {
  [Symbol.iterator]: function*() {
    var pre = 0, cur = 1;
    for (;;) {
      var temp = pre;
      pre = cur;
      cur += temp;
      yield cur;
    }
  }
}

test('generators', t => {
    for (var n of fibonacciG) {
        // truncate the sequence at 1000
        if (n > 1000)
            break;
    }
    t.is(n, 1597);
});

// generator + recursive iterators, tree traversal

class BinaryTree {
    constructor(value, left=null, right=null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }

    /** Prefix iteration */
    * [Symbol.iterator]() {
        yield this;
        if (this.left) {
            yield* this.left;
        }
        if (this.right) {
            yield* this.right;
        }
    }
}

// so cool that this works...
test('recursive iterators', t => {
    let tree = new BinaryTree('1',
        new BinaryTree('2',
        new BinaryTree('3'),
        new BinaryTree('4')),
        new BinaryTree('5'));

    let ivalue = 0;
    for (let x of tree) {        
        t.truthy(x.value == ++ivalue); // string == num
    }

});


// enhanced object literals
class Point {};
var point = new Point;
var handler = a => {};
var obj = {
    // Sets the prototype. "__proto__" or '__proto__' would also work.
    __proto__: Point,
    // Computed property name does not set prototype or trigger early error for
    // duplicate __proto__ properties.
    ['__proto__']: 'Point',
    // Shorthand for ‘handler: handler’
    handler,
    // Methods
    toString() {
     // Super calls
     return "d " + super.toString();
    },
    // Computed (dynamic) property names
    [ "prop_" + (() => 42)() ]: 42
};
test('enhanced obj literals', t => {
    t.is(obj.__proto__, 'Point');
    t.is(obj[ "prop_" + (() => 42)() ], 42 ); 
});

// various new APIs

test('new ES6 APIs', t => {
    t.truthy(Number.EPSILON);
    t.false(Number.isInteger(Infinity));
    t.false(Number.isNaN("NaN"));

    t.true(Math.acosh(3) > 1.762747174039);
    t.is(Math.hypot(3, 4), 5);
    t.is(Math.imul(Math.pow(2, 32) - 1, Math.pow(2, 32) - 2), 2);

    t.true("abcde".includes("cd"));
    t.is("abc".repeat(3), "abcabcabc");

    // Array.from(document.querySelectorAll("*")) // Returns a real Array
    
    Array.of(1, 2, 3); // Similar to new Array(...), but without special one-arg behavior
    [0, 0, 0].fill(7, 1); // [0,7,7]
    [1,2,3].findIndex(x => x == 2); // 1
    ["a", "b", "c"].entries(); // iterator [0, "a"], [1,"b"], [2,"c"]
    ["a", "b", "c"].keys(); // iterator 0, 1, 2
    ["a", "b", "c"].values(); // iterator "a", "b", "c"

});

test('Object.assign', t => {
    let lpoint = { a: 1, b: 2 };
    let npoint = Object.assign(lpoint, { origin: new Point(0,0) }) // copy all enumerable own properties
    t.is(npoint.a, 1);
});


// map, set, weakmap, weakset
// Sets
test('Set', t => {
    var s = new Set();
    s.add("hello").add("goodbye").add("hello");
    t.is(s.size, 2);
    t.true(s.has("hello"));
});

test('Maps', t => {
    var m = new Map();
    var s = new Set();
    s.add("hello").add("goodbye").add("hello");
    m.set("hello", 42);
    m.set(s, 34);
    t.is(m.get(s), 34);
});

test('Weak Maps', t => {
    var wm = new WeakMap();
    var s = new Set();
    s.add("hello").add("goodbye").add("hello");
    wm.set(s, { extra: 42 });
    t.is(wm.size, undefined); // no refs in set
});

test('Weak Sets', t => {
    var ws = new WeakSet();
    ws.add({ data: 42 });
    // Because the added object has no other references, it will not be held in the set
    t.is(ws.data, undefined); // FIXME: do I have this right?
});

// proxies
test('Proxy an object', t => {
    // Proxying a normal object; interception, virtualization, logging, etc.
    var target = {};
    var handler = {
        get: function (receiver, name) {
            return `Hello, ${name}!`;
        }
    };

    var p = new Proxy(target, handler);
    t.is(p.world, "Hello, world!");
});

test('Proxy a function obj', t => {
    // Proxying a function object
    var target = function () { return "I am the target"; };
    var handler = {
      apply: function (receiver, ...args) {
        return "I am the proxy";
      }
    };

    var p = new Proxy(target, handler);
    t.is(p(), "I am the proxy");
});
/* available traps for Proxy:

var handler =
{
  // target.prop
  get: ...,
  // target.prop = value
  set: ...,
  // 'prop' in target
  has: ...,
  // delete target.prop
  deleteProperty: ...,
  // target(...args)
  apply: ...,
  // new target(...args)
  construct: ...,
  // Object.getOwnPropertyDescriptor(target, 'prop')
  getOwnPropertyDescriptor: ...,
  // Object.defineProperty(target, 'prop', descriptor)
  defineProperty: ...,
  // Object.getPrototypeOf(target), Reflect.getPrototypeOf(target),
  // target.__proto__, object.isPrototypeOf(target), object instanceof target
  getPrototypeOf: ...,
  // Object.setPrototypeOf(target), Reflect.setPrototypeOf(target)
  setPrototypeOf: ...,
  // for (let i in target) {}
  enumerate: ...,
  // Object.keys(target)
  ownKeys: ...,
  // Object.preventExtensions(target)
  preventExtensions: ...,
  // Object.isExtensible(target)
  isExtensible :...
}

*/

// https://hacks.mozilla.org/2015/07/es6-in-depth-proxies-and-reflect/
test('Autocreate parameters! (AUTOLOAD)', t => {
    function Tree() {
        return new Proxy({}, handler);
    }

    var handler = {
        get: function (target, key, receiver) {
            if (!(key in target)) {
                target[key] = Tree();  // auto-create a sub-Tree
            }
            return Reflect.get(target, key, receiver);
        }
    };
    
    var tree = Tree();
    tree.branch1.branch3.twig = "yellow";
    
    t.truthy(tree.branch1.branch3);
    t.is(tree.branch1.branch3.twig, "yellow");
    
});

/* Symbols, not including now */


/* Decorators, not yet part of ES */

/*

function readonly (target, key, descriptor) {
    descriptor.writable = false;
    return descriptor;
}

class Cat {
    @readonly
    meow() { return `${this.name} says meow!`; }
}

test('readonly decorator', t => {
    let garfield = new Cat();
    garfield.meow = function() { console.log('meow'); }
}
*/
