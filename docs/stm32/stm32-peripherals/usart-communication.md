---
title: USART 通信
---

介绍 UART/USART 在 STM32 中的基本使用，包括波特率配置、收发流程与 DMA 协同工作要点。

## 基础
USART 用于异步串行通信，主要参数包括波特率、数据位、停止位与校验位。

## 简要示例（概念）
```c
USART_Init(USART1, 115200);
USART_SendString(USART1, "hello\n");
```

## 与 DMA 结合
- 使用 DMA 可以减少 CPU 负担，适合大量数据或连续采集场景。

## 注意事项
- 波特率误差和串口缓冲区溢出是常见问题，使用中断或 DMA 并合理设置缓冲区可缓解。

