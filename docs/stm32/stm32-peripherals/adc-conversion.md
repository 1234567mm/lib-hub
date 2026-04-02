---
title: ADC 采样与转换
---

介绍 ADC 的基本概念、采样流程、分辨率与常见配置要点，以及简单代码示例。

## 概要
ADC 将模拟电压转换为数字值。注意采样时间、输入阻抗与采样频率。

## 关键参数
- 分辨率（例如 12-bit）
- 采样时间（采样保持电路所需时间）

## 简单示例（伪代码）
```c
ADC_StartConversion(ADC1);
while(!ADC_ConversionComplete(ADC1));
uint16_t val = ADC_GetValue(ADC1);
```

## 注意
- 配置采样时间以适配信号源阻抗，避免采样误差。

