

## setState的工作原理
setState，合并渲染（异步），但是数据是实时更新的。
### setState并不奇怪

有一个能反映问题的场景：

```
...
state = {
    count: 0
}
componentDidMount() {
  this.setState({count: this.state.count + 1})
  this.setState({count: this.state.count + 1})
  this.setState({count: this.state.count + 1})
}
...
```

看起来state.count被增加了三次，但结果是增加了一次。这并不奇怪：

React快的原因之一就是，在执行`this.setState()`时，React没有忙着立即更新`state`，只是把新的`state`存到一个队列（`batchUpdate`）中。**上面三次执行`setState`只是对传进去的对象进行了合并,然后再统一处理（批处理），触发重新渲染过程，因此只重新渲染一次，结果只增加了一次**。这样做是非常明智的，因为在一个函数里调用多个setState是常见的，如果每一次调用setState都要引发重新渲染，显然不是最佳实践。React官方文档里也说了：

> 把`setState()` 看作是**重新render的一次请求而不是立刻更新组件的指令**。



### 那么调用this.setState()后什么时候this.state才会更新？

答案是即将要执行下一次的`render`函数时。



**这之间发生了什么？**
**`setState`调用后，React会执行一个事务（Transaction），在这个事务中，React将新state放进一个队列中，当事务完成后，React就会刷新队列，然后启动另一个事务，这个事务包括执行 `shouldComponentUpdate` 方法来判断是否重新渲染，如果是，React就会进行state合并（`state merge`）,生成新的state和props；如果不是，React仍然会更新`this.state`，只不过不会再`render`了。**

开发人员对`setState`感到奇怪的原因可能就是按照上述写法并不能产生预期效果，但幸运的是我们改动一下就可以实现上述累加效果：
这归功于`setState`可以接受函数作为参数：

> `setState(updater, [callback])`

```
...
state = {
    score: 0
}
componentDidMount() {
    this.setState( (prevState) => ({score : prevState.score + 1}) )
    this.setState( (prevState) => ({score : prevState.score + 1}) )
    this.setState( (prevState) => ({score : prevState.score + 1}) )
  }
}
```

这个`updater`可以为函数，该函数接受该组件**前一刻**的 state 以及**当前**的 props 作为参数，计算和返回下一刻的 state。

你会发现达到增加三次的目的了: [在Jsbin上试试看](http://jsbin.com/nazazo/edit?html,js,console,output)

这是因为React会把`setState`里传进去的函数放在一个任务队列里，React 会依次调用队列中的函数，传递给它们**前一刻**的 state。

**另外**，不知道你在[jsbin](http://jsbin.com/nazazo/edit?html,js,console,output)上的代码上注意到没有，调用`setState`后`console.log(this.state.score)`输出仍然为0，也就是`this.state`并未改变，并且只`render`了一次。




## setState操作示例

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class Example extends React.Component {
  constructor() {
    super();
    this.state = {
      val: 0
    };
  }

  componentDidMount() {
    this.setState({val: this.state.val + 1});
    console.log(this.state.val);    // 第 1 次 log

    this.setState({val: this.state.val + 1});
    console.log(this.state.val);    // 第 2 次 log

    setTimeout(() => {
      this.setState({val: this.state.val + 1});
      console.log(this.state.val);  // 第 3 次 log

      this.setState({val: this.state.val + 1});
      console.log(this.state.val);  // 第 4 次 log
    }, 0);
  }

  render() {
    return <p>Example</p>;
  }
};

ReactDOM.render(
  <Example />,
  document.getElementById('root')
);
打开console控制台，发现输出的结果是

0，0，2，3


这样就可以理解为什么第1次和第2次的setState执行后值没变了。因为在ComponentDidMount中调用setState时，渲染周期还没有结束，batchingStrategy中的isBatchingUpdates还是true，setState对应的components被存入dirtyComponents暂存起来，所以前2次setState之后的this.state.val的结果都是 0。

再观察第2类调用栈，使用了setTimeout，会在结束当前调用栈之后执行，这时渲染周期已经结束，batchingStrategy中的isBatchingUpdates为false。setState会在执行流中调用，不会进入dirtyComponents存储，所以新的state会立马生效，打印第3次和第4次的this.state.val，就会出现生效后的值了。
