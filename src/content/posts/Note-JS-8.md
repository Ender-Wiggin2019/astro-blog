---
title: 学习笔记 | JS 高级程序设计-第8章-对象、类与面向对象编程
pubDate: 2024-03-18 22:03:00.0
updated: 2024-03-18 22:03:00.0
categories: ['学习笔记']
tags: ['TS',  'Web开发']
description: '整理一下之前的笔记，当做复习。'
---

## 对象

### 属性

ECMA-262使用一些内部特性来描述属性的特征。
属性分两种：数据属性和访问器属性。

#### 数据属性

- `[[Configurable]]`：表示属性是否可以通过delete删除并重新定义，是否可以修改它的特性，以及是否可以把它改为访问器属性。
- `[[Enumerable]]`：表示属性是否可以通过`for-in`循环返回。默认情况下，所有直接定义在对象上的属性的这个特性都是`true`
- `[[Writable]]`：表示属性的值是否可以被修改。默认情况下，所有直接定义在对象上的属性的这个特性都是`true`
- `[[Value]]`：包含属性实际的值。这就是前面提到的那个读取和写入属性值的位置。这个特性的默认值为`undefined`

要修改属性的默认特性，就必须使用`Object.defineProperty()`方法。
这个方法接收3个参数：
1. 要给其添加属性的对象
2. 属性的名称
3. 一个描述符对象。描述符对象上的属性可以包含：configurable、enumerable、writable和value

```js
    let person = {};
    Object.defineProperty(person, "name", {
      configurable: false, // 不能删除这个属性
      value: "Nicholas"
    });
    console.log(person.name); // "Nicholas"
    delete person.name; // 严格模式报错
    console.log(person.name); // "Nicholas"
    let person = {};

    // 抛出错误
    Object.defineProperty(person, "name", {
      configurable: true,
      value: "Nicholas"
    });
```

#### 访问器属性

有与前面类似的`Configurable`和`Enumerable`属性，以及`Get`和`Set`。

```js
    // 定义一个对象，包含伪私有成员year_和公共成员edition
    let book = {
      year_: 2017,
      edition: 1
    };
    Object.defineProperty(book, "year", {
      get() {
        return this.year_;
      },
      set(newValue) {
        if (newValue > 2017) {
          this.year_ = newValue;
          this.edition += newValue -2017;
        }
      }
    });
    book.year = 2018;
    console.log(book.edition); // 2
```

#### 定义多个属性

```js
    let book = {};
    Object.defineProperties(book, {
      year_: {
        value: 2017
      },
      edition: {
        value: 1
      },
      year: {
        get() {
          return this.year_;
        },
        set(newValue) {
          if (newValue > 2017) {
            this.year_ = newValue;
            this.edition += newValue -2017;
          }
        }
      }
    });
```

### 读取属性的特性

使用`Object.getOwnPropertyDescriptor()`方法可以取得指定属性的属性描述符。

ECMAScript 2017新增了`Object.getOwnPropertyDescriptors()`静态方法。这个方法实际上会在每个自有属性上调用`Object.getOwnPropertyDescriptor()`并在一个**新对象**中返回它们。

### 合并对象

ES6提供了Object.assign()方法：
1. 接收一个目标对象和一个或多个源对象作为参数
2. 后将每个源对象中可枚举（`Object.propertyIsEnumerable()`返回true）和**自有属性**（`Object.hasOwnProperty()`返回true）复制到目标对象
3. 以字符串和符号为键的属性会被复制
4. 对每个符合条件的属性，这个方法会使用源对象上的`[[Get]]`取得属性的值，然后使用目标对象上的`[[Set]]`设置属性的值。

`Object.assign()`实际上对每个源对象执行的是**浅复制**。如果多个源对象都有相同的属性，则使用最后一个复制的值。
此外，从源对象访问器属性取得的值，比如获取函数，会作为一个静态值赋给目标对象。换句话说，不能在两个对象间转移获取函数和设置函数。

如果赋值期间出错，则操作会中止并退出，同时抛出错误。`Object.assign()`没有“回滚”之前赋值的概念，因此它是一个尽力而为、**可能只会完成部分复制**的方法。

### 对象标识及相等判定

ES6新增了`Object.is()`，这个方法与`===`很像

递归比较多个：
```js
    function recursivelyCheckEqual(x, ...rest) {
      return Object.is(x, rest[0]) &&
              (rest.length < 2 || recursivelyCheckEqual(...rest));
    }
```

### 增强的对象语法

1. 属性值简写：变量名与值相同时可以省略冒号及后面的内容
2. 可计算属性：**中括号包围的对象属性键**告诉运行时将其作为JS表达式而不是字符串来求值
3. 简写方法名：方法名即函数名 `let person = { sayName(name){ ... ) }

### 对象解构

解构在内部使用函数`toObject()`（不能在运行时环境中直接访问）把源数据结构转换为对象。这意味着在对象解构的上下文中，原始值会被当成对象。这也意味着（根据ToObject()的定义）, null和undefined不能被解构，否则会抛出错误。

解构并不要求变量必须在解构表达式中声明。不过，如果是给事先声明的变量赋值，则赋值表达式必须包含在一对括号中：

```js
    let personName, personAge;
    let person = {
      name: 'Matt',
      age: 27
    };
    ({name: personName, age: personAge} = person);
    console.log(personName, personAge); // Matt, 27
```

## 创建对象

### ES5 构造函数写法

```js
    function Person(name, age, job){
      this.name = name;
      this.age = age;
      this.job = job;
      this.sayName = function() {
        console.log(this.name);
      };
    }
    let person1 = new Person("Nicholas", 29, "Software Engineer");
    let person2 = new Person("Greg", 27, "Doctor");
    person1.sayName();   // Nicholas
    person2.sayName();   // Greg
```

要创建`Person`的实例，应使用`new`操作符。以这种方式调用构造函数会执行如下操作：
1. 在内存中创建一个新对象。
2. 这个新对象内部的`[[Prototype]]`特性被赋值为构造函数的`prototype`属性
3. 构造函数内部的`this`被赋值为这个新对象（即`this`指向新对象）
4. 执行构造函数内部的代码（给新对象添加属性）
5. 如果构造函数返回非空对象，则返回该对象；否则，返回刚创建的新对象

person1和person2分别保存着Person的不同实例。这两个对象都有一个constructor属性指向Person，如下所示：

```js
    console.log(person1.constructor == Person);   // true
    console.log(person2.constructor == Person);   // true
```

构造函数与普通函数唯一的区别就是调用方式不同。除此之外，构造函数也是函数。并没有把某个函数定义为构造函数的特殊语法。**任何函数只要使用`new`操作符调用就是构造函数**，而不使用`new`操作符调用的函数就是普通函数。

```js
    // 作为构造函数
    let person = new Person("Nicholas", 29, "Software Engineer");
    person.sayName();     // "Nicholas"
    // 作为函数调用
    Person("Greg", 27, "Doctor");    // 添加到window对象
    window.sayName();     // "Greg"
    // 在另一个对象的作用域中调用
    let o = new Object();
    Person.call(o, "Kristen", 25, "Nurse");
    o.sayName();    // "Kristen"
```

第二个情况中没有使用`new`，因此会将this指向global。

#### 构造函数的问题

其定义的方法会在每个实例上都创建一遍。不同实例上的函数虽然同名却不相等：

```js
    console.log(person1.sayName == person2.sayName); // false
```

解决方案是在外边先定义好函数，在构造函数内使用该函数方法的引用。但是依然会造成作用域的问题。
这个新问题可以通过原型模式来解决。

### 原型模式

每个函数都会创建一个prototype属性，这个属性是一个对象，包含应该由特定引用类型的实例共享的属性和方法。实际上，这个对象就是通过调用构造函数创建的对象的原型。
使用原型对象的好处是，在它上面定义的属性和方法可以被对象实例共享。原来在构造函数中直接赋给对象实例的值，可以直接赋值给它们的原型，如下所示：

```js
    function Person() {}
    Person.prototype.name = "Nicholas";
    Person.prototype.age = 29;
    Person.prototype.job = "Software Engineer";
    Person.prototype.sayName = function() {
      console.log(this.name);
    };
```

#### 理解原型

无论何时，只要创建一个函数，就会按照特定的规则为这个函数创建一个prototype属性（指向原型对象）。默认情况下，所有原型对象自动获得一个名为constructor的属性，指回与之关联的构造函数。对前面的例子而言，**`Person.prototype.constructor`指向`Person`**。然后，因构造函数而异，可能会给原型对象添加其他属性和方法。

在自定义构造函数时，原型对象默认只会获得constructor属性，其他的所有方法都继承自Object。每次调用构造函数创建一个新实例，这个实例的内部`[[Prototype]]`指针就会被赋值为构造函数的原型对象。
脚本中没有访问这个`[[Prototype]]`特性的标准方式，但Firefox、Safari和Chrome会在每个对象上暴露`__proto__`属性，通过这个属性可以访问对象的原型。在其他实现中，这个特性完全被隐藏了。关键在于理解这一点：实例与构造函数原型之间有直接的联系，但实例与构造函数之间没有。

```js
    /＊＊
      ＊ 构造函数可以是函数表达式
      ＊ 也可以是函数声明，因此以下两种形式都可以：
      ＊    function Person() {}
      ＊    let Person = function() {}
      ＊/
    function Person() {}
    /＊＊
      ＊ 声明之后，构造函数就有了一个
      ＊ 与之关联的原型对象：
      ＊/
    console.log(typeof Person.prototype);
    console.log(Person.prototype);
    // {
    //    constructor: f Person(),
    //    __proto__: Object
    // }
    /＊＊
      ＊ 如前所述，构造函数有一个prototype属性
      ＊ 引用其原型对象，而这个原型对象也有一个
      ＊ constructor属性，引用这个构造函数
      ＊ 换句话说，两者循环引用：
      ＊/
    console.log(Person.prototype.constructor === Person); // true
    /＊＊
      ＊ 正常的原型链都会终止于Object的原型对象
      ＊ Object原型的原型是null
      ＊/
    console.log(Person.prototype.__proto__ === Object.prototype);    // true
    console.log(Person.prototype.__proto__.constructor === Object); // true
    console.log(Person.prototype.__proto__.__proto__ === null);      // true
    console.log(Person.prototype.__proto__);
    // {
    //    constructor: f Object(),
    //    toString: ...
    //    hasOwnProperty: ...
    //    isPrototypeOf: ...
    //    ...
    // }
    let person1 = new Person(),
        person2 = new Person();
    /＊＊
      ＊ 构造函数、原型对象和实例
      ＊ 是3 个完全不同的对象：
      ＊/
    console.log(person1 ! == Person);              // true
    console.log(person1 ! == Person.prototype); // true
    console.log(Person.prototype ! == Person);   // true
    /＊＊
      ＊ 实例通过__proto__链接到原型对象，
      ＊ 它实际上指向隐藏特性[[Prototype]]
      ＊
      ＊ 构造函数通过prototype属性链接到原型对象
      ＊
      ＊ 实例与构造函数没有直接联系，与原型对象有直接联系
      ＊/
    console.log(person1.__proto__ === Person.prototype);    // true
    conosle.log(person1.__proto__.constructor === Person); // true
    /＊＊
      ＊ 同一个构造函数创建的两个实例
      ＊ 共享同一个原型对象：
      ＊/
    console.log(person1.__proto__ === person2.__proto__); // true
    /＊＊
      ＊ instanceof检查实例的原型链中
      ＊ 是否包含指定构造函数的原型：
      ＊/
    console.log(person1 instanceof Person);              // true
    console.log(person1 instanceof Object);              // true
    console.log(Person.prototype instanceof Object);   // true
```

- `isPrototypeOf()`会在传入参数的`[[Prototype]]`指向调用它的对象时返回`true`
- `Object.getPrototypeOf()`，返回参数的内部特性`[[Prototype]]`的值
- `Object.setPrototypeOf()`方法，可以向实例的私有特性`[[Prototype]]`写入一个新值。不建议使用这个方法，建议使用`Object.create()`来创建一个新对象，同时为其指定原型

```js
    let biped = {
      numLegs: 2
    };
    let person = Object.create(biped);
    person.name = 'Matt';
    console.log(Object.getPrototypeOf(person) === biped);   // true
```

#### 原型层级

在通过对象访问属性时，会按照这个属性的名称开始搜索。搜索开始于对象实例本身。

注意，虽然可以通过实例读取原型对象上的值，但不可能通过实例重写这些值。如果在实例上添加了一个与原型对象中同名的属性，那就会在实例上创建这个属性，这个属性会**遮住原型对象上的属性**。

```js
    function Person() {}
    Person.prototype.name = "Nicholas";
    Person.prototype.age = 29;
    Person.prototype.job = "Software Engineer";
    Person.prototype.sayName = function() {
      console.log(this.name);
    };
    let person1 = new Person();
    let person2 = new Person();
    person1.name = "Greg";
    console.log(person1.name);   // "Greg"，来自实例
    console.log(person2.name);   // "Nicholas"，来自原型
```

`hasOwnProperty()`方法用于确定某个属性是在实例上还是在原型对象上。\

`Object.getOwnPropertyDescriptor()`方法只对实例属性有效。要取得原型属性的描述符，就必须直接在原型对象上调用`Object.getOwnPropertyDescriptor()`。

#### `in`

- 在单独使用时，in操作符会在可以通过对象访问指定属性时返回true，无论该属性是在实例上还是在原型上（`hasOwnProperty`只有实例上才能返回true）。
- 在`for-in`循环中使用`in`操作符时，可以通过对象访问且可以被枚举的属性都会返回，包括实例属性和原型属性。**遮蔽**原型中**不可枚举属性的实例属性也会在`for-in`循环中返回**，因为默认情况下开发者定义的属性都是可枚举的。

要获得对象上所有可枚举的实例属性，可以使用`Object.keys()`方法。

如果想列出所有实例属性，无论是否可以枚举，都可以使用`Object.getOwnPropertyNames()`:

```js
    let keys = Object.getOwnPropertyNames(Person.prototype);
    console.log(keys);    // "[constructor,name,age,job,sayName]"
```

```js
	// 类似的符号版本
    let k1 = Symbol('k1'),
        k2 = Symbol('k2');
    let o = {
      [k1]: 'k1',
      [k2]: 'k2'
    };
    console.log(Object.getOwnPropertySymbols(o));
    // [Symbol(k1), Symbol(k2)]
```

#### 属性枚举顺序

- `for-in`循环和`Object.keys()`的枚举顺序是不确定的
- `Object.getOwnPropertyNames()`、`Object.getOwnPropertySymbols()`和`Object.assign()`的枚举顺序是确定性的。**先以升序枚举数值键，然后以插入顺序枚举字符串和符号键。在对象字面量中定义的键以它们逗号分隔的顺序插入。**

```js
    let k1 = Symbol('k1'),
        k2 = Symbol('k2');
    let o = {
      1: 1,
      first: 'first',
      [k1]: 'sym2',
      second: 'second',
      0: 0
    };
    o[k2] = 'sym2';
    o[3] = 3;
    o.third = 'third';
    o[2] = 2;
    console.log(Object.getOwnPropertyNames(o));
    // ["0", "1", "2", "3", "first", "second", "third"]
    console.log(Object.getOwnPropertySymbols(o));
    // [Symbol(k1), Symbol(k2)]
```

#### 对象迭代

- Object.values()返回对象值的数组
- Object.entries()返回键/值对的数组。

符号属性均会被忽略。

#### 一些注意事项

1. 原型重写

```js
    function Person() {}
    Person.prototype = {
	  // constructor: Person, // 需要显式定义，同时需要设置为不可枚举值
      name: "Nicholas",
      age: 29,
      job: "Software Engineer",
      sayName() {
        console.log(this.name);
      }
    };

    // 恢复constructor属性，推荐写法
    Object.defineProperty(Person.prototype, "constructor", {
      enumerable: false,
      value: Person
    });
```

这种写法等于覆盖了原有的原型，也就是说`Person`原型对象的`constructor`并不会指向`Person`了。但是，`instanceof`依然可以正确捕获（因为只单纯检查是否在原型链上）：

```js
    let friend = new Person();
    console.log(friend instanceof Object);        // true
    console.log(friend instanceof Person);        // true
    console.log(friend.constructor == Person);   // false
    console.log(friend.constructor == Object);   // true
```

注意，实例只有指向原型的指针，没有指向构造函数的指针：

```js
    function Person() {}
    let friend = new Person();
    Person.prototype = {
      constructor: Person,
      name: "Nicholas",
      age: 29,
      job: "Software Engineer",
      sayName() {
        console.log(this.name);
      }
    };
    friend.sayName();   // 错误
```

这是因为firend指向的原型还是最初的原型，而这个原型上并没有sayName属性。

#### 原型的问题

原型模式也不是没有问题。首先，它弱化了向构造函数传递初始化参数的能力，会导致所有实例默认都取得相同的属性值。虽然这会带来不便，但还不是原型的最大问题。原型的最主要问题源自它的共享特性，即不同实例共享同样的浅复制属性：

```js
    function Person() {}
    Person.prototype = {
      constructor: Person,
      name: "Nicholas",
      age: 29,
      job: "Software Engineer",
      friends: ["Shelby", "Court"],
      sayName() {
        console.log(this.name);
      }
    };
    let person1 = new Person();
    let person2 = new Person();
    person1.friends.push("Van");
    console.log(person1.friends);   // "Shelby,Court,Van"
    console.log(person2.friends);   // "Shelby,Court,Van"
    console.log(person1.friends === person2.friends);   // true
```

## 继承

很多OOP分为接口继承和实现继承，而JS只有实现继承。

### 原型链

```js
    function SuperType() {
      this.property = true;
    }
    SuperType.prototype.getSuperValue = function() {
      return this.property;
    };
    function SubType() {
      this.subproperty = false;
    }
    // 继承SuperType
    SubType.prototype = new SuperType();
    SubType.prototype.getSubValue = function () {
      return this.subproperty;
    };
    let instance = new SubType();
    console.log(instance.getSuperValue()); // true
```

原型链虽然是实现继承的强大工具，但它也有问题。主要问题出现在原型中包含引用值的时候。前面在谈到原型的问题时也提到过，原型中包含的引用值会在所有实例间共享，这也是为什么属性通常会在构造函数中定义而不会定义在原型上的原因。在使用原型实现继承时，原型实际上变成了另一个类型的实例。这意味着原先的实例属性摇身一变成为了原型属性。

```js
    function SuperType() {
      this.colors = ["red", "blue", "green"];
    }
    function SubType() {}
    // 继承SuperType
    SubType.prototype = new SuperType();
    let instance1 = new SubType();
    instance1.colors.push("black");
    console.log(instance1.colors); // "red, blue, green, black"
    let instance2 = new SubType();
    console.log(instance2.colors); // "red, blue, green, black"
```

### 盗用构造函数

为了解决原型包含引用值导致的继承问题，一种叫作“盗用构造函数”（constructor stealing）的技术在开发社区流行起来（这种技术有时也称作“对象伪装”或“经典继承”）。

```js
    function SuperType() {
      this.colors = ["red", "blue", "green"];
    }
    function SubType() {
      //继承SuperType
      SuperType.call(this);
    }
    let instance1 = new SubType();
    instance1.colors.push("black");
    console.log(instance1.colors); // "red, blue, green, black"
    let instance2 = new SubType();
    console.log(instance2.colors); // "red, blue, green"
```

盗用构造函数的主要缺点，也是使用构造函数模式自定义类型的问题：必须在构造函数中定义方法，因此函数不能重用。此外，子类也不能访问父类原型上定义的方法，因此所有类型只能使用构造函数模式。由于存在这些问题，盗用构造函数基本上也不能单独使用。

### 组合继承

组合继承（有时候也叫伪经典继承）综合了原型链和盗用构造函数，将两者的优点集中了起来。基本的思路是使用原型链继承原型上的属性和方法，而通过盗用构造函数继承实例属性。

```js
    function SuperType(name){
      this.name = name;
      this.colors = ["red", "blue", "green"];
    }
    SuperType.prototype.sayName = function() {
      console.log(this.name);
    };
    function SubType(name, age){
      // 继承属性
      SuperType.call(this, name);
      this.age = age;
    }
    // 继承方法
    SubType.prototype = new SuperType();
    SubType.prototype.sayAge = function() {
      console.log(this.age);
    };
    let instance1 = new SubType("Nicholas", 29);
    instance1.colors.push("black");
    console.log(instance1.colors);   // "red, blue, green, black"
    instance1.sayName();               // "Nicholas";
    instance1.sayAge();                // 29
    let instance2 = new SubType("Greg", 27);
    console.log(instance2.colors);   // "red, blue, green"
    instance2.sayName();               // "Greg";
    instance2.sayAge();                // 27
```

## 类

与函数定义不同的是，虽然函数声明可以提升，但类定义不能。

### 类构造函数

方法名constructor会告诉解释器在使用new操作符创建类的新实例时，应该调用这个函数。构造函数的定义不是必需的，不定义构造函数相当于将构造函数定义为空函数。

使用new操作符实例化的操作等于使用new调用其构造函数。唯一可感知的不同之处就是，JavaScript解释器知道使用new和类意味着应该使用constructor函数进行实例化。

**重要，使用new调用类的构造函数会执行如下操作**：
1. 在内存中创建一个新对象
2. 这个新对象内部的`[[Prototype]]`指针被赋值为构造函数的`prototype`属性
3. 构造函数内部的`this`被赋值为这个新对象（即`this`指向新对象）
4. 执行构造函数内部的代码（给新对象添加属性）
5. 如果构造函数返回非空对象，则返回该对象；否则，返回刚创建的新对象。

类实例化时传入的参数会用作构造函数的参数。如果不需要参数，则类名后面的括号也是可选的。

类构造函数与构造函数的主要区别是，调用类构造函数必须使用new操作符。而普通构造函数如果不使用new调用，那么就会以全局的this（通常是window）作为内部对象。调用类构造函数时如果忘了使用new则会抛出错误。

类构造函数实例化之后依然可以通过 new 调用：

```js
    class Person {}
    // 使用类创建一个新实例
    let p1 = new Person();
    p1.constructor();
    // TypeError: Class constructor Person cannot be invoked without 'new'
    // 使用对类构造函数的引用创建一个新实例
    let p2 = new p1.constructor();
```

- **类本身在使用new调用时就会被当成构造函数**。
- 类中定义的constructor方法不会被当成构造函数，在对它使用instanceof操作符时会返回false。
- 但是，如果在创建实例时直接将类构造函数当成普通构造函数来使用，那么instanceof操作符的返回值会反转：

```js
    class Person {}
    let p1 = new Person();
    console.log(p1.constructor === Person);           // true
    console.log(p1 instanceof Person);                  // true
    console.log(p1 instanceof Person.constructor);   // false
    let p2 = new Person.constructor();
    console.log(p2.constructor === Person);           // false
    console.log(p2 instanceof Person);                  // false
    console.log(p2 instanceof Person.constructor);   // true
```

### 实例、原型和类成员

静态类：

```js
    class Person {
      constructor() {
        // 添加到this的所有内容都会存在于不同的实例上
        this.locate = () => console.log('instance', this);
      }
      // 定义在类的原型对象上
      locate() {
        console.log('prototype', this);
      }
      //定义在类本身上
      static locate(){
        console.log('class', this);
      }
    }
    let p = new Person();
    p.locate();                     // instance, Person {}
    Person.prototype.locate();   // prototype, {constructor: ... }
    Person.locate();               // class, class Person {}
```

可迭代实例：

```js
    class Person {
      constructor() {
        this.nicknames = ['Jack', 'Jake', 'J-Dog'];
      }
      ＊[Symbol.iterator](){
        yield ＊ this.nicknames.entries();
      }
    }
    let p = new Person();
    for (let [idx, nickname] of p) {
      console.log(nickname);
    }
    // Jack
    // Jake
    // J-Dog
```

### 继承

派生类的方法可以通过super关键字引用它们的原型。这个关键字只能在派生类中使用，而且仅限于类构造函数、实例方法和静态方法内部。在类构造函数中使用super可以调用父类构造函数。

```js
    class Vehicle {
      constructor() {
        this.hasEngine = true;
      }
    }
    class Bus extends Vehicle {
      constructor() {
        // 不要在调用super()之前引用this，否则会抛出ReferenceError
        super(); // 相当于super.constructor()
        console.log(this instanceof Vehicle);   // true
        console.log(this);                          // Bus { hasEngine: true }
      }
    }
    new Bus();
```

super 传参同理：

```js
    class Vehicle {
      constructor(licensePlate) {
        this.licensePlate = licensePlate;
      }
    }
    class Bus extends Vehicle {
      constructor(licensePlate) {
        super(licensePlate);
      }
    }
    console.log(new Bus('1337H4X')); // Bus { licensePlate: '1337H4X' }
```

如果没有定义类构造函数，在实例化派生类时会调用super()，而且会传入所有传给派生类的参数。

在类构造函数中，不能在调用super()之前引用this：

```js
    class Vehicle {}
    class Bus extends Vehicle {
      constructor() {
        console.log(this);
      }
    }
    new Bus();
    // ReferenceError: Must call super constructor in derived class
    // before accessing 'this' or returning from derived constructor
```