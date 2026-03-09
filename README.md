# BabyRoutine iOS (MVP)

母婴作息助手 iOS MVP（SwiftUI + iOS 17）。

## 功能（当前版本）
- 记录事件：吃奶 / 睡眠 / 清醒 / 哄睡
- Today 24h 时间轴（颜色区分）
- 每日统计（总奶量、总睡眠、总清醒、次数、平均哄睡时长）
- 历史页（最近7天汇总）
- 设置页（提醒提前量）
- 本地通知提醒（基础版）

## 运行方式

### 方式A：使用 XcodeGen（推荐）
1. 安装 XcodeGen：`brew install xcodegen`
2. 在仓库根目录执行：`xcodegen generate`
3. 打开 `BabyRoutine.xcodeproj`
4. 选择模拟器，运行

### 方式B：手动新建 Xcode 项目
1. 在 Xcode 新建 iOS App（SwiftUI，iOS 17）
2. 将 `BabyRoutine` 目录下源码拖入项目
3. 运行

## 下一步计划
- 时间轴交互（缩放/点击看明细）
- 7天+3天加权预测
- 异常值过滤
- 三月龄策略提醒
