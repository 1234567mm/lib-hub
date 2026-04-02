---
title: PWM 控制
---

介绍如何使用定时器生成 PWM 信号用于电机或 LED 调光等应用，包含配置要点和示例。

## 概要
PWM（脉宽调制）通过改变占空比来控制平均电压/功率，STM32 常通过定时器通道输出 PWM。

## 简要步骤
1. 配置定时器时钟、预分频与自动重装载值。
2. 配置通道为 PWM 模式并设置比较值（占空比）。
3. 启动定时器并使能输出。

## 示例（概念）
```c
TIM_SetAutoReload(TIM3, 1000); // 周期
TIM_SetCompare(TIM3, TIM_CHANNEL_1, 250); // 25% 占空比
TIM_EnablePWM(TIM3, TIM_CHANNEL_1);
```

