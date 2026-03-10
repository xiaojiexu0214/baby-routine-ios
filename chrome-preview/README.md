# Chrome 预览版（静态原型）

这个目录是给 `BabyRoutine iOS` 做的 Chrome 快速预览，不依赖 Xcode。用于看页面结构和基础交互。

## 启动方式

在仓库根目录执行：

```bash
cd baby-routine-ios/chrome-preview
python3 -m http.server 5173
```

然后在 Chrome 打开：

`http://127.0.0.1:5173`

## 包含内容

- 四个 Tab：今天 / 记录 / 历史 / 设置
- 今日时间线可视化（模拟）
- 今日统计自动计算（模拟）
- 快速记录 + 表单保存
- 设置页提醒参数滑块

> 说明：这是 UI/交互预览，不是 iOS 真实运行时；后续可继续做成和 SwiftUI 更一致的高保真版本。
