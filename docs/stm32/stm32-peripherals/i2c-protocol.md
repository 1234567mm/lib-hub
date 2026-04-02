---
title: I2C 协议
---

I2C（TWI）是常见的串行总线协议，适用于短距离主从通信。本文概述协议、常见问题与 STM32 使用注意事项。

## 协议要点
- 主/从模式、7-bit/10-bit 地址、起止条件、ACK/NACK。

## STM32 注意事项
- 配置正确的时钟频率和时序（标准模式 100kHz、快速模式 400kHz 等）。

## 使用示例（概念）
```c
I2C_Start(i2c);
I2C_SendAddress(i2c, addr, I2C_Direction_Transmitter);
I2C_Write(i2c, data, len);
I2C_Stop(i2c);
```

