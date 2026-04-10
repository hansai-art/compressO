```
<NextUIModal
    ...
    onClose={() => {
        ...
        disclosure.onClose() // -> 每個 modal 都要呼叫這個，不然會出現「Maximum Depth Exceeded」錯誤
    }}
    />
```
