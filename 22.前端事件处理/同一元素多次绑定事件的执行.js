// 同一元素多次绑定事件的执行.js

同一元素绑定多次事件

1. DOM元素直接绑定，如果DOM元素绑定两个"onclick" 事件，只会执行第一个；

2. 通过js脚本中绑定多个事件，只会执行最后一个事件；

3. 用“addEventListener”绑定多个事件，按照绑定顺序都会执行。