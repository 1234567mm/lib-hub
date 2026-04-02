---
title: 定时器基础
---

介绍 STM32 定时器的基本概念（基本定时器、通用定时器、高级定时器）、常见配置与 PWM 用法示例。

## 定时器类型
- 基本定时器：用于定时/触发，不带 PWM 输出。
- 通用定时器：可用于输入捕获、输出比较、PWM 等。
- 高级定时器：支持死区、刹车等高级特性（用于电机控制）。

## 示例：简单 PWM 配置（概念）
```c
// 伪代码：配置定时器周期和占空比
TIM_SetPrescaler(TIM2, prescaler);
TIM_SetAutoReload(TIM2, period);
TIM_SetCompare(TIM2, channel, pulse);
TIM_EnablePWM(TIM2, channel);
```

## 注意事项
- 选择合适的时钟源和分频以满足精度需求。

