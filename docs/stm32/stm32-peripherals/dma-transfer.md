---
title: DMA 传输
---

描述 DMA 在 STM32 中用于外设与内存之间高效传输的用途、基本配置和使用场景。

## 概要
DMA 可在无需 CPU 干预下完成大量数据搬运，常用于 ADC、USART、SPI 与存储外设。

## 使用模式
- 循环模式、正常模式、记忆到外设/外设到记忆等。

## 示例（概念）
```c
// 配置 DMA 通道以在 ADC 完成采样后把数据写入缓冲区
DMA_Config(channel, src_addr, dst_addr, length);
DMA_Enable(channel);
```

## 注意
- 确保缓冲区对齐和大小正确，避免内存冲突。

