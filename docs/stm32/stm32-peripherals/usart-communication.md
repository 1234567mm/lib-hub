---
title: USART 通信
---

USART（Universal Synchronous/Asynchronous Receiver/Transmitter）是 STM32 最常用的外设之一，用于实现串行通信。本文档详细介绍 USART 的工作原理、寄存器配置、标准库函数以及中断和 DMA 模式的应用。

## USART/UART 异步通信原理

### 异步通信基础

USART 支持同步和异步两种模式。在异步模式下，数据以字符为单位进行传输，每个字符包含：

- **起始位**（1位）：逻辑低电平，标识字符开始
- **数据位**（5-9位）：实际要传输的数据
- **校验位**（可选）：用于错误检测
- **停止位**（1-2位）：逻辑高电平，标识字符结束

### 通信帧格式

标准的异步通信帧格式如下：

```
┌─────┬─────────┬───────────┬───────┬─────┐
│ START│  DATA   │  PARITY   │ STOP1 │STOP2│
│  (1b)│ (5-9b)  │  (0-1b)   │  (1b) │(0-1b)│
└─────┴─────────┴───────────┴───────┴─────┘
```

### 波特率概念

波特率（Baud Rate）表示每秒传输的符号数。对于异步通信，波特率直接影响通信距离和可靠性：

| 波特率 | 典型应用场景 | 传输一个字节时间 |
|--------|--------------|------------------|
| 4800   | 远距离、低速 | ~2.08ms          |
| 9600   | 常见低速应用 | ~1.04ms          |
| 115200 | 常见高速应用 | ~86.4μs          |
| 921600 | 高速数据传输 | ~10.8μs          |

### STM32 波特率计算

STM32 的 USART 波特率由以下公式计算：

```
 baud_rate = f_ck / (16 * USARTDIV)
```

其中：
- `f_ck` 是 USART 时钟频率（对于 APB1 总线最大 36MHz，APB2 总线最大 72MHz）
- `USARTDIV` 是一个无符号定点数，存储在 BRR 寄存器中

**示例**：如果 f_ck = 72MHz，需要 115200 波特率：

```
USARTDIV = 72000000 / (115200 * 16) = 39.0625
```

在 BRR 寄存器中：
- USARTDIV_Mantissa = 39（整数部分）
- USARTDIV_Fraction = 0.0625 * 16 = 1（分数部分）

**实际波特率误差**：

```
实际波特率 = 72000000 / (16 * 39.0625) = 115200 Hz
误差 = 0%
```

### 全双工与半双工

- **全双工**：USART1 的 TX（发送）和 RX（接收）可以同时工作
- **半双工**：通过单线模式（USART_CR3 的 HDSEL 位）实现，仅用一根数据线

## USART 寄存器详解

STM32F1 的 USART 寄存器结构如下：

### 1. SR - 状态寄存器（Status Register）

| 位 | 名称 | 说明 |
|----|------|------|
| 5  | RXNE | 接收缓冲区非空，读 USART_DR 后自动清零 |
| 6  | TC   | 发送完成标志，发送完数据帧后置位，写 USART_DR 清零 |
| 7  | TXE  | 发送缓冲区空，写入 USART_DR 后自动清零 |

```c
// 轮询方式检查接收
while (!(USART1->SR & USART_SR_RXNE));
uint16_t data = USART1->DR;

// 轮询方式检查发送
while (!(USART1->SR & USART_SR_TXE));
USART1->DR = data;
```

### 2. DR - 数据寄存器（Data Register）

- **发送时**：写入数据会自动启动发送
- **接收时**：读取数据获取接收的字节

```c
// 发送单个字节
USART_SendData(USART1, 'A');

// 接收单个字节
uint16_t received = USART_ReceiveData(USART1);
```

### 3. BRR - 波特率寄存器（Baud Rate Register）

```
  15:4  USARTDIV[11:0]  整数部分
  3:0   DIV_Fraction[3:0]  小数部分（4位精度）
```

```c
// 配置 115200 波特率（72MHz 时钟）
USART1->BRR = (39 << 4) | 1;  // 39.0625 -> 0x271
```

### 4. CR1 - 控制寄存器 1

| 位 | 名称 | 说明 |
|----|------|------|
| 13 | UE   | USART 使能位 |
| 12 | M    | 数据字长：0=8位，1=9位 |
| 10 | PCE  | 校验控制使能 |
| 9  | PS   | 校验选择：0=偶校验，1=奇校验 |
| 5  | TXEIE| 发送缓冲区空中断使能 |
| 6  | TCIE | 发送完成中断使能 |
| 5  | RXNEIE| 接收缓冲区非空中断使能 |

```c
// 使能 USART，8位数据，无校验
USART1->CR1 = USART_CR1_UE | USART_CR1_TE | USART_CR1_RE;
// 等价于
USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;
```

### 5. CR2 - 控制寄存器 2

| 位 | 名称 | 说明 |
|----|------|------|
| 13:12 | STOP[1:0] | 停止位：00=1位，01=0.5位，10=2位，11=1.5位 |

```c
// 配置 1 位停止位
USART1->CR2 &= ~USART_CR2_STOP;
```

### 6. CR3 - 控制寄存器 3

| 位 | 名称 | 说明 |
|----|------|------|
| 6  | CTSIE | CTS 中断使能 |
| 3  | CTSE | CTS 硬件流控制使能 |
| 2  | RTSE | RTS 硬件流控制使能 |

## USART 标准库配置

### 基本配置步骤

**头文件引用**：

```c
#include "stm32f10x_usart.h"
#include "stm32f10x_rcc.h"
#include "stm32f10x_gpio.h"
```

### GPIO 引脚配置

USART1 默认引脚：
- TX = PA9（复用推挽输出）
- RX = PA10（浮空输入）

```c
void USART1_GPIO_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    // 使能 GPIO 和 USART1 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);

    // 配置 USART1 Tx (PA9) 为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 配置 USART1 Rx (PA10) 为浮空输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
}
```

### USART 初始化

```c
void USART1_Config(void)
{
    USART_InitTypeDef USART_InitStructure;

    // 配置 USART1
    USART_InitStructure.USART_BaudRate = 115200;           // 波特率
    USART_InitStructure.USART_WordLength = USART_WordLength_8b; // 8位数据位
    USART_InitStructure.USART_StopBits = USART_StopBits_1;      // 1位停止位
    USART_InitStructure.USART_Parity = USART_Parity_No;        // 无校验
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None; // 无硬件流控制
    USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx; // 收发模式

    USART_Init(USART1, &USART_InitStructure);
    USART_Cmd(USART1, ENABLE);  // 使能 USART1
}
```

### 完整初始化函数

```c
void USART1_Init(void)
{
    // GPIO 配置
    USART1_GPIO_Config();

    // USART 参数配置
    USART1_Config();
}
```

## 发送和接收函数

### 发送单个字符

```c
void USART1_SendByte(uint16_t data)
{
    // 等待发送缓冲区为空
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, data);
}
```

### 发送字符串

```c
void USART1_SendString(char *str)
{
    while (*str != '\0')
    {
        USART1_SendByte(*str);
        str++;
    }
}
```

### 接收单个字符（轮询）

```c
uint16_t USART1_ReceiveByte(void)
{
    // 等待接收缓冲区有数据
    while (USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == RESET);
    return USART_ReceiveData(USART1);
}
```

## 中断模式

### NVIC 配置

```c
void USART1_NVIC_Config(void)
{
    NVIC_InitTypeDef NVIC_InitStructure;

    NVIC_InitStructure.NVIC_IRQChannel = USART1_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;

    NVIC_Init(&NVIC_InitStructure);
}
```

### 中断服务函数

```c
#define RX_BUFFER_SIZE 128
uint8_t rx_buffer[RX_BUFFER_SIZE];
volatile uint16_t rx_head = 0;
volatile uint16_t rx_tail = 0;

void USART1_IRQHandler(void)
{
    // 接收中断
    if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET)
    {
        rx_buffer[rx_head] = USART_ReceiveData(USART1);
        rx_head = (rx_head + 1) % RX_BUFFER_SIZE;
    }

    // 发送中断
    if (USART_GetITStatus(USART1, USART_IT_TXE) != RESET)
    {
        if (rx_tail != rx_head)  // 回显模式
        {
            USART_SendData(USART1, rx_buffer[rx_tail]);
            rx_tail = (rx_tail + 1) % RX_BUFFER_SIZE;
        }
        else
        {
            USART_ITConfig(USART1, USART_IT_TXE, DISABLE);  // 缓冲区空，关闭发送中断
        }
    }
}
```

### 使能中断

```c
void USART1_Interrupt_Config(void)
{
    USART1_GPIO_Config();

    USART_InitTypeDef USART_InitStructure;
    USART_InitStructure.USART_BaudRate = 115200;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;

    USART_Init(USART1, &USART_InitStructure);

    // 使能接收中断
    USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);

    USART1_NVIC_Config();
    USART_Cmd(USART1, ENABLE);
}
```

## DMA 模式

### DMA 请求映射

| DMA通道 | USART1_TX | USART1_RX |
|---------|-----------|-----------|
| DMA1    | Channel 4 | Channel 5 |

### DMA 发送配置

```c
#define TX_BUFFER_SIZE 256
uint8_t tx_buffer[TX_BUFFER_SIZE];

void DMA_USART1_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    // 使能 DMA1 时钟
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // DMA 初始化结构体
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;  // 外设地址
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)tx_buffer;         // 存储器地址
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;                  // 外设作为目的地
    DMA_InitStructure.DMA_BufferSize = TX_BUFFER_SIZE;                 // 数据长度
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;    // 外设地址不增
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;             // 存储器地址递增
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;                       // 正常模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;                       // 非存储器到存储器

    DMA_Init(DMA1_Channel4, &DMA_InitStructure);
    DMA_Cmd(DMA1_Channel4, ENABLE);

    // 使能 USART1 的 DMA 发送
    USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);
}
```

### DMA+USART 发送函数

```c
void USART1_DMA_Send(uint8_t *data, uint16_t len)
{
    // 复制数据到发送缓冲区
    memcpy(tx_buffer, data, len);

    // 配置 DMA 传输长度
    DMA1_Channel4->CNDTR = len;

    // 启动 DMA 传输
    DMA_Cmd(DMA1_Channel4, ENABLE);
}
```

### DMA+USART 接收配置

```c
#define RX_BUFFER_SIZE 256
uint8_t rx_buffer[RX_BUFFER_SIZE];

void DMA_USART1_RX_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)rx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;           // 外设作为源
    DMA_InitStructure.DMA_BufferSize = RX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;              // 循环模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel5, &DMA_InitStructure);
    DMA_Cmd(DMA1_Channel5, ENABLE);

    // 使能 USART1 的 DMA 接收
    USART_DMACmd(USART1, USART_DMAReq_Rx, ENABLE);
}
```

## printf 重定向

### 方法一：使用标准库

```c
#include <stdio.h>

// 重定向 printf 到 USART1
int fputc(int ch, FILE *f)
{
    USART_SendData(USART1, (uint8_t)ch);
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    return ch;
}

// 重定向 fgetc（如果需要从 USART 输入）
int fgetc(FILE *f)
{
    while (USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == RESET);
    return (int)USART_ReceiveData(USART1);
}
```

### 方法二：不使用标准库（减少代码体积）

```c
// 简单的 printf 替代函数
void USART1_Printf(char *fmt, ...)
{
    char buffer[256];
    va_list args;
    va_start(args, fmt);
    vsnprintf(buffer, sizeof(buffer), fmt, args);
    va_end(args);
    USART1_SendString(buffer);
}
```

## 多字节数据发送

### 发送 16 位数据

```c
void USART1_SendData16(uint16_t data)
{
    // 发送高字节
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, (uint8_t)(data >> 8));

    // 发送低字节
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, (uint8_t)(data & 0xFF));
}
```

### 发送 float 数据

```c
void USART1_SendFloat(float value)
{
    uint8_t *p = (uint8_t *)&value;
    for (int i = 0; i < sizeof(float); i++)
    {
        USART1_SendByte(p[i]);
    }
}
```

## 常见问题与解决方案

### 1. 波特率误差问题

**问题**：通信距离较长时出现误码

**原因**：不同晶振频率下，115200 波特率误差较大

**解决**：
| 晶振频率 | 115200 实际波特率 | 误差率   |
|----------|-------------------|----------|
| 8MHz     | 115108            | -0.09%   |
| 11.0592MHz | 115200         | 0%       |
| 12MHz    | 115385            | +0.16%   |

**建议**：使用 11.0592MHz 晶振可获得精确的常用波特率

### 2. 串口缓冲区溢出

**问题**：高速发送时数据丢失

**解决**：
- 使用 DMA 模式
- 增加接收缓冲区大小
- 使用接收中断+发送应答机制

### 3. 接收数据不完整

**问题**：接收到的数据不完整或有截断

**排查**：
1. 检查 RX 引脚连接是否正确
2. 确认双方波特率一致
3. 检查数据位、停止位、校验位配置匹配

### 4. DMA 传输卡住

**问题**：DMA 传输后程序不响应

**排查**：
1. 检查 DMA 通道是否正确
2. 确认缓冲区地址对齐
3. 确认 DMA 传输完成后有正确的后续处理

## USART 其他功能

### 同步模式

STM32 的 USART 还支持同步模式，需要额外配置 SCK 引脚：

```c
// 配置 SCK 引脚
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_8;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);

// 使能同步模式
USART_ClockInitTypeDef USART_ClockInitStructure;
USART_ClockInitStructure.USART_Clock = USART_Clock_Enable;  // 使能时钟
USART_ClockInitStructure.USART_CPOL = USART_CPOL_Low;       // 时钟极性
USART_ClockInitStructure.USART_CPHA = USART_CPHA_1Edge;     // 时钟相位
USART_ClockInitStructure.USART_LastBit = USART_LastBit_Disable;
USART_ClockInit(USART1, &USART_ClockInitStructure);
```

### 硬件流控制

当使能 RTS/CTS 引脚时，可以实现硬件流控制：

```c
// 配置 RTS (PA12) 和 CTS (PA11)
USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_RTS_CTS;
```

## 总结

USART 是 STM32 最基础也最常用的外设之一。本文档涵盖了：

- **通信原理**：异步串行通信的帧格式和波特率计算
- **寄存器配置**：SR、DR、BRR、CR1、CR2、CR3 的详细说明
- **标准库函数**：GPIO 配置、USART 初始化、收发函数
- **中断模式**：NVIC 配置和中断服务函数编写
- **DMA 模式**：减少 CPU 负担的高速传输方案
- **常见问题**：波特率误差、缓冲区溢出等问题的解决方案

掌握这些内容后，可以熟练使用 USART 完成各种串行通信任务。
