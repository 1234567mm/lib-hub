---
title: SPI 协议
---

SPI 是全双工、主从式的同步串行接口，常用于高速外设通信（如传感器、Flash、显示屏）。

## 基本概念
- 时钟极性（CPOL）与相位（CPHA）需要主从双方一致。
- 主设备产生 SCK，使用片选（CS）选择从设备。

## STM32 注意事项
- 配置波特率分频、数据位宽和 NSS 管脚管理（硬件/软件）。

## 示例（伪代码）
```c
SPI_Transmit(SPI1, tx_buf, len);
SPI_Receive(SPI1, rx_buf, len);
```

