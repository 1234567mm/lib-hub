---
title: DMA 传输
---

DMA（Direct Memory Access，直接内存访问）是一种允许外设直接与内存交换数据的技术，无需 CPU 干预。STM32F1 的 DMA 控制器可以显著提高数据传输效率，降低 CPU 负担，特别适用于 ADC 数据采集、USART/SPI 数据收发等高速数据传输场景。本文档详细介绍 DMA 的工作原理、通道映射、配置方法和实际应用。

## DMA 原理

### 为什么需要 DMA

传统的数据传输方式需要 CPU 参与：

```c
// CPU 参与的数据传输
for (int i = 0; i < 100; i++)
{
    buffer[i] = USART1->DR;  // CPU 逐字节读取
}
```

问题：
- CPU 被占用，无法处理其他任务
- 传输速度受 CPU 指令执行速度限制
- 高频率中断导致系统响应变慢

### DMA 工作机制

DMA 控制器接管数据传输，CPU 可以并行处理其他任务：

```
传统方式：
CPU ──────────────────────────► 数据传输 ──────► 处理

DMA 方式：
CPU ──────────────────────────► 处理 ─────────► 处理
DMA ──────────────────────────► 数据传输 ──────►
```

### DMA 特性

STM32F1 DMA 控制器特性：
- **12 个通道**（DMA1: 7 通道，DMA2: 5 通道）
- **独立的源和目标端口**，支持存储器到外设、外设到存储器、存储器到存储器传输
- **可编程的数据长度**：1~65535 字节
- **支持循环模式**：传输完成后自动重新开始
- **独立的中断和 flags**：传输完成、半满、错误等

## DMA 通道映射

### DMA1 请求映射

| 通道 | 外设请求 |
|------|----------|
| 通道 1 | ADC1 |
| 通道 2 | USART3_TX |
| 通道 3 | USART3_RX |
| 通道 4 | USART2_TX |
| 通道 5 | USART2_RX |
| 通道 6 | SPI2_RX / I2S2_RX |
| 通道 7 | SPI2_TX / I2S2_TX |

### DMA2 请求映射

| 通道 | 外设请求 |
|------|----------|
| 通道 1 | ADC2 |
| 通道 2 | SPI1_RX |
| 通道 3 | SPI1_TX |
| 通道 4 | USART1_TX |
| 通道 5 | USART1_RX |

### DMA 控制器特性对比

| 特性 | DMA1 | DMA2 |
|------|------|------|
| 通道数 | 7 | 5 |
| 支持 ADC | 是 | 是 |
| 支持 SPI | 是 | 是 |
| 支持 USART | 是 | 是 |
| 支持 Timer | 是 | 是 |
| 存储器到存储器 | 不支持 | 支持 |

## DMA 传输类型

### 1. 外设到存储器（Peripheral to Memory）

数据从外设数据寄存器传输到内存缓冲区：

```
USART_DR / SPI_DR / ADC_DR ──► 内存缓冲区
```

**典型应用**：
- USART 接收数据
- SPI 从设备接收数据
- ADC 转换结果采集

### 2. 存储器到外设（Memory to Peripheral）

数据从内存缓冲区传输到外设数据寄存器：

```
内存缓冲区 ──► USART_DR / SPI_DR / DAC_DHR
```

**典型应用**：
- USART 发送数据
- SPI 发送数据
- DAC 输出

### 3. 存储器到存储器（Memory to Memory）

数据从一块内存传输到另一块内存：

```
内存区域 A ──► 内存区域 B
```

**典型应用**：
- 内存数据复制
- Flash 数据读取

**注意**：DMA2 支持此功能，DMA1 不支持。

## DMA 寄存器详解

### DMA_ISR - 中断状态寄存器

每个通道对应 4 个标志位：

| 位 | 标志 | 说明 |
|----|------|------|
| 0  | GIF1  | 通道 1 全局中断 |
| 1  | TCIF1 | 通道 1 传输完成 |
| 2  | HTIF1 | 通道 1 半传输 |
| 3  | TEIF1 | 通道 1 传输错误 |

每个通道占 4 位，依此类推。

### DMA_IFCR - 中断标志清除寄存器

清除 ISR 中的标志位：

```c
// 清除通道 1 传输完成标志
DMA_ClearITPendingBit(DMA1_Channel1, DMA_IT_TC);
```

### DMA_CCRx - 通道配置寄存器（x = 1~7）

| 位 | 名称 | 说明 |
|----|------|------|
| 4  | MEM2MEM | 存储器到存储器模式 |
| 3:2 | PL[1:0] | 优先级：00=低，01=中，10=高，11=最高 |
| 1  | MSIZE[1:0] | 存储器数据宽度：00=8位，01=16位，10=32位 |
| 0  | PSIZE[1:0] | 外设数据宽度：00=8位，01=16位，10=32位 |
| 7  | MINC   | 存储器地址增量模式 |
| 6  | PINC   | 外设地址增量模式 |
| 5  | CIRC   | 循环模式 |
| 4  | DIR    | 数据方向：0=从外设读，1=从存储器读 |
| 3  | TEIE   | 传输错误中断使能 |
| 2  | HTIE   | 半传输中断使能 |
| 1  | TCIE   | 传输完成中断使能 |
| 0  | EN     | 通道使能 |

### DMA_CNDTRx - 通道数据传输数量寄存器

16 位寄存器，存储剩余要传输的数据量：

```c
// 设置传输数据个数
DMA_SetCurrDataCounter(DMA1_Channel1, 100);

// 获取剩余数据个数
uint16_t remaining = DMA_GetCurrDataCounter(DMA1_Channel1);
```

### DMA_CPARx - 外设地址寄存器

存储外设数据寄存器的地址：

```c
// 设置 USART1 数据寄存器地址
DMA1_Channel4->CPAR = (uint32_t)&USART1->DR;

// 设置 ADC1 数据寄存器地址
DMA1_Channel1->CPAR = (uint32_t)&ADC1->DR;
```

### DMA_CMARx - 存储器地址寄存器

存储内存缓冲区首地址：

```c
// 设置缓冲区地址
DMA1_Channel4->CMAR = (uint32_t)tx_buffer;
```

## DMA 配置步骤

### 基本配置流程

```c
// 1. 使能 DMA 时钟
RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

// 2. 配置 DMA 通道参数
DMA_InitTypeDef DMA_InitStructure;
DMA_InitStructure.DMA_PeripheralBaseAddr = peripheral_addr;  // 外设地址
DMA_InitStructure.DMA_MemoryBaseAddr = memory_addr;          // 存储器地址
DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;          // 数据方向
DMA_InitStructure.DMA_BufferSize = buffer_size;              // 数据个数
DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;  // 外设地址不增
DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;      // 存储器地址递增
DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;  // 外设数据宽度
DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;          // 存储器数据宽度
DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;                 // 正常模式
DMA_InitStructure.DMA_Priority = DMA_Priority_High;          // 优先级
DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;                 // 非存储器到存储器

DMA_Init(DMA_Channelx, &DMA_InitStructure);

// 3. 配置外设的 DMA 请求（如果需要）
USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);  // USART DMA 发送
ADC_DMACmd(ADC1, ENABLE);                         // ADC DMA 请求

// 4. 使能 DMA 通道
DMA_Cmd(DMA_Channelx, ENABLE);
```

## USART DMA 发送

### 硬件连接

```
内存缓冲区 ──► DMA1_Channel4 ──► USART1->DR ──► TX 引脚
```

### 代码实现

```c
#define TX_BUFFER_SIZE  256
uint8_t tx_buffer[TX_BUFFER_SIZE];

void USART1_DMA_TX_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    // 使能 DMA1 时钟
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // 配置 DMA 通道 4（USART1_TX）
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;                 // 从存储器读
    DMA_InitStructure.DMA_BufferSize = TX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;    // 外设地址不增
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;              // 存储器地址递增
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;                       // 正常模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel4, &DMA_InitStructure);

    // 使能 USART1 的 DMA 发送请求
    USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);
}

/**
 * DMA 发送字符串
 * @param str: 要发送的字符串
 */
void USART1_DMA_SendString(char *str)
{
    uint16_t len = strlen(str);

    // 复制字符串到发送缓冲区
    memcpy(tx_buffer, str, len);

    // 设置传输长度
    DMA1_Channel4->CNDTR = len;

    // 启动 DMA 传输
    DMA_Cmd(DMA1_Channel4, ENABLE);
}

/**
 * 等待 DMA 传输完成
 */
void USART1_DMA_WaitComplete(void)
{
    // 等待传输完成标志
    while (DMA_GetFlagStatus(DMA1_FLAG_TC4) == RESET);
    DMA_ClearFlag(DMA1_FLAG_TC4);

    // 失能 DMA 通道（循环模式下不需要）
    DMA_Cmd(DMA1_Channel4, DISABLE);
}
```

## USART DMA 接收

### 硬件连接

```
RX 引脚 ──► USART1->DR ──► DMA1_Channel5 ──► 内存缓冲区
```

### 代码实现

```c
#define RX_BUFFER_SIZE  256
uint8_t rx_buffer[RX_BUFFER_SIZE];
volatile uint16_t rx_head = 0;

void USART1_DMA_RX_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // 配置 DMA 通道 5（USART1_RX）
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)rx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;                  // 从外设读
    DMA_InitStructure.DMA_BufferSize = RX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;                      // 循环模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel5, &DMA_InitStructure);

    // 使能 USART1 的 DMA 接收请求
    USART_DMACmd(USART1, USART_DMAReq_Rx, ENABLE);

    // 使能 DMA 通道
    DMA_Cmd(DMA1_Channel5, ENABLE);
}

/**
 * 获取已接收的数据长度
 */
uint16_t USART1_DMA_ReceiveLen(void)
{
    return RX_BUFFER_SIZE - DMA_GetCurrDataCounter(DMA1_Channel5);
}
```

## ADC DMA 采集

### 硬件连接

```
ADC1->DR ──► DMA1_Channel1 ──► 内存缓冲区
```

### 代码实现

```c
#define ADC_BUFFER_SIZE  100
uint16_t adc_buffer[ADC_BUFFER_SIZE];

void ADC1_DMA_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // 配置 DMA 通道 1（ADC1）
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&ADC1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)adc_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;                  // 从外设读
    DMA_InitStructure.DMA_BufferSize = ADC_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;              // 递增存储
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_HalfWord;  // 12位 ADC
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_HalfWord;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;                      // 循环模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel1, &DMA_InitStructure);

    // 使能 ADC1 的 DMA 请求
    ADC_DMACmd(ADC1, ENABLE);

    DMA_Cmd(DMA1_Channel1, ENABLE);
}

/**
 * 获取 ADC 采样平均值
 */
uint16_t ADC_GetAverage(void)
{
    uint32_t sum = 0;
    for (int i = 0; i < ADC_BUFFER_SIZE; i++)
    {
        sum += adc_buffer[i];
    }
    return sum / ADC_BUFFER_SIZE;
}
```

### ADC DMA 多通道采集

当使用多个 ADC 通道时，数据在 DMA 缓冲区中交错存储：

```c
#define ADC_NUM_CHANNELS  3
#define ADC_SAMPLES_PER_CHANNEL  64
#define ADC_BUFFER_SIZE  (ADC_NUM_CHANNELS * ADC_SAMPLES_PER_CHANNEL)
uint16_t adc_buffer[ADC_BUFFER_SIZE];

void ADC_DMA_MultiChannel_Config(void)
{
    // ... ADC 配置 ...

    // 配置 3 个通道
    ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 2, ADC_SampleTime_55Cycles5);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 3, ADC_SampleTime_55Cycles5);

    // DMA 配置
    DMA_InitStructure.DMA_BufferSize = ADC_BUFFER_SIZE;
    // ... 其他配置 ...
}

/**
 * 获取指定通道的平均值
 * @param channel: 通道号 0, 1, 2
 */
uint16_t ADC_GetChannelAverage(uint8_t channel)
{
    uint32_t sum = 0;
    uint16_t *base = &adc_buffer[channel * ADC_SAMPLES_PER_CHANNEL];

    for (int i = 0; i < ADC_SAMPLES_PER_CHANNEL; i++)
    {
        sum += base[i];
    }
    return sum / ADC_SAMPLES_PER_CHANNEL;
}
```

## SPI DMA 传输

### SPI DMA 发送

```c
#define SPI_TX_BUFFER_SIZE  256
uint8_t spi_tx_buffer[SPI_TX_BUFFER_SIZE];

void SPI1_DMA_TX_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // DMA1 Channel 3 用于 SPI1_TX
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&SPI1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)spi_tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = SPI_TX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel3, &DMA_InitStructure);

    // 使能 SPI1 DMA 发送请求
    SPI_I2S_DMACmd(SPI1, SPI_I2S_DMAReq_Tx, ENABLE);
}

void SPI1_DMA_Send(uint8_t *data, uint16_t len)
{
    // 复制数据
    memcpy(spi_tx_buffer, data, len);

    // 设置传输长度
    DMA1_Channel3->CNDTR = len;

    // 启动传输
    DMA_Cmd(DMA1_Channel3, ENABLE);
}
```

### SPI DMA 全双工接收发送

```c
#define SPI_BUFFER_SIZE  256
uint8_t spi_tx_buffer[SPI_BUFFER_SIZE];
uint8_t spi_rx_buffer[SPI_BUFFER_SIZE];

void SPI1_DMA_FullDuplex_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // TX 配置（Channel 3）
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&SPI1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)spi_tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = SPI_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;
    DMA_Init(DMA1_Channel3, &DMA_InitStructure);

    // RX 配置（Channel 2）
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&SPI1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)spi_rx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;
    DMA_InitStructure.DMA_BufferSize = SPI_BUFFER_SIZE;
    DMA_Init(DMA1_Channel2, &DMA_InitStructure);

    // 使能 SPI1 DMA 请求
    SPI_I2S_DMACmd(SPI1, SPI_I2S_DMAReq_Tx | SPI_I2S_DMAReq_Rx, ENABLE);
}

void SPI1_DMA_Transfer(uint8_t *tx_buf, uint8_t *rx_buf, uint16_t len)
{
    // 复制发送数据
    memcpy(spi_tx_buffer, tx_buf, len);

    // 预填接收缓冲区（提供时钟）
    memset(spi_rx_buffer, 0xFF, len);

    // 设置传输长度
    DMA1_Channel3->CNDTR = len;
    DMA1_Channel2->CNDTR = len;

    // 启动 RX 在前，TX 在后
    DMA_Cmd(DMA1_Channel2, ENABLE);
    DMA_Cmd(DMA1_Channel3, ENABLE);
}
```

## DMA 中断

### DMA 中断类型

| 中断 | 触发条件 |
|------|----------|
| TCIF | 传输完成 |
| HTIF | 半传输（传输了 BufferSize/2 个数据） |
| TEIF | 传输错误 |

### 中断配置

```c
void DMA_USART_Interrupt_Config(void)
{
    NVIC_InitTypeDef NVIC_InitStructure;

    // 配置 NVIC
    NVIC_InitStructure.NVIC_IRQChannel = DMA1_Channel4_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);

    // 使能 DMA 中断
    DMA_ITConfig(DMA1_Channel4, DMA_IT_TC, ENABLE);
}

void DMA1_Channel4_IRQHandler(void)
{
    if (DMA_GetITStatus(DMA1_IT_TC4))
    {
        // 传输完成处理
        DMA_ClearITPendingBit(DMA1_IT_TC4);

        // 失能 DMA 通道
        DMA_Cmd(DMA1_Channel4, DISABLE);
    }
}
```

## 存储器到存储器传输

### DMA2 内存复制

```c
#define MEMORY_BUFFER_SIZE  1024
uint8_t src_buffer[MEMORY_BUFFER_SIZE];
uint8_t dst_buffer[MEMORY_BUFFER_SIZE];

void DMA_MemoryToMemory_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    // 注意：只有 DMA2 支持存储器到存储器传输
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA2, ENABLE);

    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)src_buffer;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)dst_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;
    DMA_InitStructure.DMA_BufferSize = MEMORY_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Enable;    // 源地址递增
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;            // 目标地址递增
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Enable;                         // 存储器到存储器模式

    DMA_Init(DMA2_Channel1, &DMA_InitStructure);
}

void DMA_MemoryCopy(void)
{
    DMA_Cmd(DMA2_Channel1, ENABLE);

    // 等待传输完成
    while (DMA_GetFlagStatus(DMA2_FLAG_TC1) == RESET);
    DMA_ClearFlag(DMA2_FLAG_TC1);

    DMA_Cmd(DMA2_Channel1, DISABLE);
}
```

## 循环模式

循环模式在传输完成后自动重新开始，适用于连续数据采集：

```c
void DMA_Circular_Mode_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    // 配置为循环模式
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;

    // ... 其他配置 ...

    DMA_Init(DMA1_Channel1, &DMA_InitStructure);
    DMA_Cmd(DMA1_Channel1, ENABLE);
}
```

**循环模式应用**：
- ADC 连续采样
- USART 接收（ring buffer）
- 示波器数据采集

## 完整初始化模板

### USART + DMA 完整初始化

```c
#include "stm32f10x_dma.h"
#include "stm32f10x_usart.h"
#include "stm32f10x_rcc.h"

#define TX_BUFFER_SIZE  256
#define RX_BUFFER_SIZE  256
uint8_t tx_buffer[TX_BUFFER_SIZE];
uint8_t rx_buffer[RX_BUFFER_SIZE];

void USART1_DMA_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;
    USART_InitTypeDef USART_InitStructure;
    DMA_InitTypeDef DMA_InitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;

    // 1. GPIO 配置
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_DMA1, ENABLE);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 2. USART 配置
    USART_InitStructure.USART_BaudRate = 115200;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;
    USART_Init(USART1, &USART_InitStructure);

    // 3. DMA TX 配置（Channel 4）
    DMA_DeInit(DMA1_Channel4);
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = TX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;
    DMA_Init(DMA1_Channel4, &DMA_InitStructure);

    // 4. DMA RX 配置（Channel 5）
    DMA_DeInit(DMA1_Channel5);
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)rx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;
    DMA_InitStructure.DMA_BufferSize = RX_BUFFER_SIZE;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;  // RX 使用循环模式
    DMA_Init(DMA1_Channel5, &DMA_InitStructure);

    // 5. 使能 DMA 和 USART
    USART_DMACmd(USART1, USART_DMAReq_Tx | USART_DMAReq_Rx, ENABLE);
    DMA_Cmd(DMA1_Channel4, ENABLE);
    DMA_Cmd(DMA1_Channel5, ENABLE);
    USART_Cmd(USART1, ENABLE);
}
```

## 常见问题

### 1. DMA 传输不启动

**排查步骤**：
1. 检查 DMA 时钟是否使能
2. 检查外设的 DMA 请求是否使能
3. 检查 DMA 通道是否使能
4. 检查 BufferSize 是否 > 0
5. 检查 NVIC 中断配置（如果使用中断）

### 2. 数据传输不完整

**原因**：
- 传输过程中修改了 CNDTR
- DMA 优先级不够，被其他通道抢占
- 外设发送/接收速度跟不上

### 3. DMA 死锁

**原因**：DMA 配置错误导致总线仲裁问题

**解决**：
- 确保使用正确的 DMA 控制器和通道
- 避免同时配置多个通道访问同一外设

### 4. 内存地址对齐

**问题**：32 位访问要求地址 4 字节对齐

**解决**：
```c
// 确保缓冲区地址对齐
uint32_t adc_buffer[128] __attribute__((aligned(4)));
```

### 5. 循环模式与 Normal 模式混用

**问题**：切换模式后 DMA 不工作

**解决**：切换模式前先失能 DMA

```c
DMA_Cmd(DMA1_Channel1, DISABLE);
DMA_SetMode(DMA1_Channel1, DMA_Mode_Circular);
DMA_Cmd(DMA1_Channel1, ENABLE);
```

## DMA 性能优化

### 提高传输效率

1. **使用AHB总线**：DMA 访问 SRAM 使用 AHB 总线，速度更快
2. **地址对齐**：确保数据宽度与地址对齐匹配
3. **适当优先级**：根据应用设置合理的 DMA 优先级
4. **突发传输**：配置 MBURST 和 PBURST（如果需要）

### 计算带宽

```
带宽 = 数据宽度 × 时钟频率
```

例如：16 位 ADC，14MHz ADCCLK
```
带宽 = 16 × 14MHz = 224Mbps
```

## 总结

DMA 是提高系统性能的关键技术：

- **减轻 CPU 负担**：数据传输无需 CPU 干预
- **提高传输效率**：避免中断开销，实现高速传输
- **多通道映射**：不同外设对应不同 DMA 通道
- **多种模式**：正常模式、循环模式、存储器到存储器
- **中断支持**：传输完成、半满、错误等中断

掌握 DMA 配置对于高效嵌入式系统开发至关重要。
