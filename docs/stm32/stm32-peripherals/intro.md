---
sidebar_position: 1
---

# STM32外设驱动

本栏目深入讲解STM32各外设的工作原理与驱动编写方法，涵盖UART、SPI、I2C、ADC、PWM等常用外设。

## 内容列表

- [串口通信USART](./usart-communication)
- [SPI总线协议](./spi-protocol)
- [I2C总线协议](./i2c-protocol)
- [模数转换ADC](./adc-conversion)
- [脉宽调制PWM](./pwm-control)
- [DMA数据传输](./dma-transfer)

## 外设难度梯度

```
入门级          基础级          进阶级
  │               │               │
  ▼               ▼               ▼
 GPIO         USART/SPI       USB/ETH
 按键/LED      I2C传感器       CAN总线
```

## 应用场景

| 外设 | 典型应用 |
|------|----------|
| USART | 调试打印、GPS模块 |
| SPI | OLED屏幕、Flash存储 |
| I2C | 陀螺仪、温湿度传感器 |
| ADC | 电位器、光照强度 |
| PWM | 电机调速、LED调光 |

---

*外设是STM32与外部世界交互的桥梁，熟练掌握外设开发是进阶的关键。*
