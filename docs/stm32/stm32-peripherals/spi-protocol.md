---
title: SPI 协议
---

SPI（Serial Peripheral Interface）是一种高速、全双工、同步的串行通信协议，广泛应用于 Flash 存储器、传感器、显示屏、AD/DA 转换器等外设。本文档详细介绍 SPI 协议原理、四种工作模式、STM32 寄存器配置以及标准库开发。

## SPI 协议原理

### 基本架构

SPI 系统包含一个主设备（Master）和一个或多个从设备（Slave），通过四根信号线连接：

| 信号线 | 全称 | 方向 | 说明 |
|--------|------|------|------|
| SCK    | Serial Clock | Master → Slave | 时钟信号，由主设备产生 |
| MOSI   | Master Out Slave In | Master → Slave | 主出从入数据线 |
| MISO   | Master In Slave Out | Slave → Master | 从出主入数据线 |
| CS/NSS | Chip Select / Slave Select | Master → Slave | 片选信号，低电平有效 |

### 数据传输机制

SPI 是同步协议，数据在 SCK 的边沿进行采样和移位：

```
      8 clocks
  ───┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌────────
     └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘
SCK
     ┌───────────────────────────────┐
MOSI │ D7  D6  D5  D4  D3  D2  D1  D0 │  (MSB first)
     └───────────────────────────────┘

     ┌───────────────────────────────┐
MISO │ D7  D6  D5  D4  D3  D2  D1  D0 │
     └───────────────────────────────┘
```

**全双工传输**：在主设备发送一个字节的同时，从设备也返回一个字节。数据移出（shift）和移入（sample）同时发生。

### SPI 特性

- **高速传输**：SPI 支持比 I2C 高得多的速度，常见 4MHz、10MHz、20MHz 甚至更高
- **无应答机制**：SPI 没有像 I2C 那样的从设备应答位，主设备无法确认数据是否被正确接收
- **无地址机制**：通过硬件片选（CS）线选择从设备，不支持像 I2C 那样的设备地址寻址
- **简单的协议**：协议开销小，适合对效率要求高的场景

## SPI 四种工作模式

SPI 有四种工作模式，由时钟极性（CPOL）和时钟相位（CPHA）共同决定。

### 时钟极性 CPOL

- **CPOL = 0**：空闲时 SCK 为低电平，活跃时 SCK 为高电平
- **CPOL = 1**：空闲时 SCK 为高电平，活跃时 SCK 为低电平

### 时钟相位 CPHA

- **CPHA = 0**：在 SCK 的第一个边沿采样数据（奇数边沿）
- **CPHA = 1**：在 SCK 的第二个边沿采样数据（偶数边沿）

### 四种模式组合

| 模式 | CPOL | CPHA | SCK空闲电平 | 采样边沿 | 数据有效性 |
|------|------|------|-------------|----------|------------|
| Mode 0 | 0    | 0    | 低          | 奇数边沿（第一个） | 空闲到活跃的边沿 |
| Mode 1 | 0    | 1    | 低          | 偶数边沿（第二个） | 活跃到空闲的边沿 |
| Mode 2 | 1    | 0    | 高          | 奇数边沿（第一个） | 空闲到活跃的边沿 |
| Mode 3 | 1    | 1    | 高          | 偶数边沿（第二个） | 活跃到空闲的边沿 |

### 时序图详解

#### 模式 0 (CPOL=0, CPHA=0)

```
      ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
SCK ──┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
      ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑
      1   2   3   4   5   6   7   8   ← 边沿序号

CS ────────────────────────────────────────────────
      ┌─────────────────────────────────────────┐
      │ 设备选中，有效通信                       │
      └─────────────────────────────────────────┘

      ↓ ← MSB 在第一个边沿前就放到数据线上
MOSI ─┘ D7 D6 D5 D4 D3 D2 D1 D0
      ↑___________|
            在边沿1采样

MISO ────────────────────────────────────── D7~D0
```

#### 模式 1 (CPOL=0, CPHA=1)

```
SCK ──┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
      └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └─
      1   2   3   4   5   6   7   8   ← 边沿序号

MOSI ──────┐ D7 D6 D5 D4 D3 D2 D1 D0
          ↑_| 在边沿2采样
```

#### 模式 2 (CPOL=1, CPHA=0)

```
      ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
SCK ──┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
      ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑
      1   2   3   4   5   6   7   8   ← 边沿序号
```

#### 模式 3 (CPOL=1, CPHA=1)

```
SCK ──┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
      └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └─
      1   2   3   4   5   6   7   8   ← 边沿序号
```

### 选择正确的模式

不同的 SPI 从设备支持不同的模式，常见对应关系：

| 设备类型 | 典型模式 | 说明 |
|----------|----------|------|
| Flash (W25Qxx) | Mode 0 | 大多数 Flash 使用模式 0 |
| SD Card | Mode 0 | SD 卡规范要求模式 0 |
| OLED (SSD1306) | Mode 0 | OLED 显示屏通常用模式 0 |
| AD7606 | Mode 1 | 某些 ADC 使用模式 1 |
| Lora (SX1278) | Mode 0 | Lora 模块通常用模式 0 |

## STM32 SPI 寄存器详解

### SPI_CR1 - 控制寄存器 1

| 位 | 名称 | 说明 |
|----|------|------|
| 15 | BIDIMODE | 双线单向模式：0=双线全双工，1=单线半双工 |
| 14 | BIDIOE   | 双向模式下输出使能 |
| 13 | CRCEN   | 硬件 CRC 使能 |
| 12 | CRCNEXT | 下一传输为 CRC |
| 11 | DFF     | 数据帧格式：0=8位，1=16位 |
| 10 | RXONLY  | 只听模式（只接收，无发送） |
| 9  | SSM     | 软件从设备管理：1=使用软件管理 NSS |
| 8  | SSI     | 内部从设备选择（当 SSM=1 时有效） |
| 7  | LSBFIRST| 位顺序：0=MSB优先，1=LSB优先 |
| 6  | SPE     | SPI 使能 |
| 5:3 | BR[2:0] | 波特率控制：000=2分频，001=4分频，010=8分频，011=16分频，100=32分频，101=64分频，110=128分频，111=256分频 |
| 2  | MSTR    | 主模式选择：1=主设备，0=从设备 |
| 1  | CPOL    | 时钟极性：0=空闲低电平，1=空闲高电平 |
| 0  | CPHA    | 时钟相位：0=第一个边沿采样，1=第二个边沿采样 |

### SPI_CR2 - 控制寄存器 2

| 位 | 名称 | 说明 |
|----|------|------|
| 12 | TXEIE   | 发送缓冲区空中断使能 |
| 11 | RXNEIE  | 接收缓冲区非空中断使能 |
| 10 | ERRIE   | 错误中断使能 |
| 9  | SSOE    | SS 输出使能（当配置为主模式时） |
| 8  | TXDMAEN | TX DMA 使能 |
| 7  | RXDMAEN | RX DMA 使能 |

### SPI_SR - 状态寄存器

| 位 | 名称 | 说明 |
|----|------|------|
| 7  | BSY    | 总线忙标志（发送/接收进行中） |
| 6  | OVR    | 溢出标志（接收数据被覆盖） |
| 5  | MODF   | 模式故障（从设备模式下 NSS 拉低） |
| 4  | CRCERR | CRC 校验错误 |
| 3  | UDR    | 模式下（从设备发送数据但缓冲区空） |
| 1  | TXE    | 发送缓冲区空 |
| 0  | RXNE   | 接收缓冲区非空 |

### SPI_DR - 数据寄存器

- **写入**：将要发送的数据写入 DR，数据在 SPI 总线上移出
- **读取**：读取 DR 获取接收到的数据

```c
// 发送一个字节
while (!(SPI1->SR & SPI_SR_TXE));  // 等待 TXE 置位
SPI1->DR = data;

// 接收一个字节
while (!(SPI1->SR & SPI_SR_RXNE)); // 等待 RXNE 置位
uint8_t received = SPI1->DR;
```

## STM32 SPI 引脚配置

### SPI1 引脚映射（APB2）

| 功能 | GPIO | 配置 |
|------|------|------|
| SCK  | PA5  | 复用推挽输出 |
| MISO | PA6  | 浮空输入/复用输入 |
| MOSI | PA7  | 复用推挽输出 |
| NSS  | PA4  | 复用推挽输出（或软件控制） |

### SPI2 引脚映射（APB1）

| 功能 | GPIO | 配置 |
|------|------|------|
| SCK  | PB13 | 复用推挽输出 |
| MISO | PB14 | 浮空输入/复用输入 |
| MOSI | PB15 | 复用推挽输出 |
| NSS  | PB12 | 复用推挽输出（或软件控制） |

## 标准库配置

### GPIO 配置函数

```c
void SPI1_GPIO_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    // 使能 GPIOA 和 SPI1 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_SPI1, ENABLE);

    // 配置 SCK (PA5), MOSI (PA7) 为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 配置 MISO (PA6) 为浮空输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 配置 NSS (PA4) 为软件控制
    // 如果使用硬件 NSS，则配置为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_4;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 初始化时置高 NSS（取消选中所有从设备）
    GPIO_SetBits(GPIOA, GPIO_Pin_4);
}
```

### SPI 初始化函数

```c
void SPI1_Config(void)
{
    SPI_InitTypeDef SPI_InitStructure;

    // SPI1 配置
    SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex;  // 双线全双工
    SPI_InitStructure.SPI_Mode = SPI_Mode_Master;                       // 主设备
    SPI_InitStructure.SPI_DataSize = SPI_DataSize_8b;                   // 8位数据帧
    SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low;                          // 时钟空闲低电平
    SPI_InitStructure.SPI_CPHA = SPI_CPHA_1Edge;                        // 第一个边沿采样
    SPI_InitStructure.SPI_NSS = SPI_NSS_Soft;                           // 软件 NSS 管理
    SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_4;  // 4分频，APB2=72MHz/4=18MHz
    SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB;                  // MSB 先传输
    SPI_InitStructure.SPI_CRCPolynomial = 7;                            // CRC 多项式（不使用可忽略）

    SPI_Init(SPI1, &SPI_InitStructure);
    SPI_Cmd(SPI1, ENABLE);  // 使能 SPI1
}
```

### 完整初始化函数

```c
void SPI1_Init(void)
{
    SPI1_GPIO_Config();
    SPI1_Config();
}
```

## 数据收发函数

### 发送并接收单个字节

```c
uint8_t SPI1_SendByte(uint8_t data)
{
    // 等待 TXE 标志（发送缓冲区空）
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);

    // 发送数据
    SPI_I2S_SendData(SPI1, data);

    // 等待 RXNE 标志（接收缓冲区非空）
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);

    // 读取接收到的数据
    return SPI_I2S_ReceiveData(SPI1);
}
```

### 发送并接收多个字节

```c
void SPI1_SendBuffer(uint8_t *tx_buf, uint8_t *rx_buf, uint16_t len)
{
    for (uint16_t i = 0; i < len; i++)
    {
        // 等待 TXE
        while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);
        SPI_I2S_SendData(SPI1, tx_buf[i]);

        // 等待 RXNE
        while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);
        rx_buf[i] = SPI_I2S_ReceiveData(SPI1);
    }
}
```

### 只发送数据

```c
void SPI1_Transmit(uint8_t *data, uint16_t len)
{
    for (uint16_t i = 0; i < len; i++)
    {
        while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);
        SPI_I2S_SendData(SPI1, data[i]);
    }
}
```

### 只接收数据

```c
void SPI1_Receive(uint8_t *buf, uint16_t len)
{
    for (uint16_t i = 0; i < len; i++)
    {
        // 发送 dummy byte 来产生时钟信号
        while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);
        SPI_I2S_SendData(SPI1, 0xFF);

        // 等待接收完成
        while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);
        buf[i] = SPI_I2S_ReceiveData(SPI1);
    }
}
```

## 从设备管理

### 软件 NSS（推荐）

```c
// 片选从设备
void SPI1_Select(void)
{
    GPIO_ResetBits(GPIOA, GPIO_Pin_4);
}

// 取消片选
void SPI1_Deselect(void)
{
    GPIO_SetBits(GPIOA, GPIO_Pin_4);
}
```

### 硬件 NSS

配置 CR2 寄存器的 SSOE 位：

```c
// 配置为主设备硬件 NSS 输出
SPI_SSOutputCmd(SPI1, ENABLE);
```

## 16位数据模式

当配置为 16 位数据帧时，每个 SPI 传输发送两个字节：

```c
void SPI1_Config_16bit(void)
{
    SPI_InitTypeDef SPI_InitStructure;

    SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex;
    SPI_InitStructure.SPI_Mode = SPI_Mode_Master;
    SPI_InitStructure.SPI_DataSize = SPI_DataSize_16b;                  // 16位数据
    SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low;
    SPI_InitStructure.SPI_CPHA = SPI_CPHA_1Edge;
    SPI_InitStructure.SPI_NSS = SPI_NSS_Soft;
    SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_4;
    SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB;
    SPI_InitStructure.SPI_CRCPolynomial = 7;

    SPI_Init(SPI1, &SPI_InitStructure);
    SPI_Cmd(SPI1, ENABLE);
}

// 16位数据发送
uint16_t SPI1_SendHalfWord(uint16_t data)
{
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET);
    SPI_I2S_SendData(SPI1, data);

    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET);
    return SPI_I2S_ReceiveData(SPI1);
}
```

## DMA 模式

### DMA 发送配置

```c
#define SPI1_TX_BUFFER_SIZE 256
uint8_t spi_tx_buffer[SPI1_TX_BUFFER_SIZE];

void SPI1_DMA_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // DMA1 Channel3 用于 SPI1_TX
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&SPI1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)spi_tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = SPI1_TX_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel3, &DMA_InitStructure);

    // 使能 SPI1 DMA 请求
    SPI_I2S_DMACmd(SPI1, SPI_I2S_DMAReq_Tx, ENABLE);
}
```

### DMA 发送函数

```c
void SPI1_DMA_Send(uint8_t *data, uint16_t len)
{
    // 复制数据到发送缓冲区
    memcpy(spi_tx_buffer, data, len);

    // 配置 DMA 传输长度
    DMA1_Channel3->CNDTR = len;

    // 启动 DMA 传输
    DMA_Cmd(DMA1_Channel3, ENABLE);
}
```

## 中断模式

```c
void SPI1_Interrupt_Config(void)
{
    NVIC_InitTypeDef NVIC_InitStructure;

    // 配置 NVIC
    NVIC_InitStructure.NVIC_IRQChannel = SPI1_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);

    // 使能 SPI 中断
    SPI_I2S_ITConfig(SPI1, SPI_I2S_IT_RXNE, ENABLE);
}

void SPI1_IRQHandler(void)
{
    if (SPI_I2S_GetITStatus(SPI1, SPI_I2S_IT_RXNE) != RESET)
    {
        uint8_t received = SPI_I2S_ReceiveData(SPI1);
        // 处理接收到的数据
    }
}
```

## 实际应用示例

### W25Qxx Flash 读写

```c
#define W25QXX_CS_PIN  GPIO_Pin_4
#define W25QXX_CS_PORT GPIOA

#define W25QXX_WriteEnable        0x06
#define W25QXX_WriteDisable       0x04
#define W25QXX_ReadStatusReg1     0x05
#define W25QXX_ReadData           0x03
#define W25QXX_PageProgram        0x02

void W25QXX_Init(void)
{
    // SPI1 已初始化
}

void W25QXX_CS_Select(void)
{
    GPIO_ResetBits(W25QXX_CS_PORT, W25QXX_CS_PIN);
}

void W25QXX_CS_Deselect(void)
{
    GPIO_SetBits(W25QXX_CS_PORT, W25QXX_CS_PIN);
}

void W25QXX_WriteEnable(void)
{
    W25QXX_CS_Select();
    SPI1_SendByte(W25QXX_WriteEnable);
    W25QXX_CS_Deselect();
}

uint8_t W25QXX_ReadStatus(void)
{
    uint8_t status;
    W25QXX_CS_Select();
    SPI1_SendByte(W25QXX_ReadStatusReg1);
    status = SPI1_SendByte(0xFF);
    W25QXX_CS_Deselect();
    return status;
}

void W25QXX_WaitForWriteEnd(void)
{
    while (W25QXX_ReadStatus() & 0x01);  // 等待 BUSY 位清零
}

void W25QXX_ReadData(uint32_t addr, uint8_t *buf, uint32_t len)
{
    W25QXX_CS_Select();
    SPI1_SendByte(W25QXX_ReadData);
    SPI1_SendByte((addr >> 16) & 0xFF);
    SPI1_SendByte((addr >> 8) & 0xFF);
    SPI1_SendByte(addr & 0xFF);
    SPI1_Receive(buf, len);
    W25QXX_CS_Deselect();
}
```

## 常见问题

### 1. 数据错位

**症状**：接收到的数据每个 bit 都偏移了一位

**原因**：主从设备的 CPOL 和 CPHA 不一致

**解决**：确保主从设备使用相同的工作模式

### 2. 只接收不到数据

**症状**：MOSI 有信号，但 MISO 始终为 0xFF

**原因**：
- 从设备未选中（CS 未拉低）
- 从设备未供电
- MISO 引脚配置错误

**解决**：检查硬件连接和 CS 片选信号

### 3. 读取数据全为 0xFF

**症状**：无论发送什么，接收总是 0xFF

**原因**：
- 从设备未正确响应
- 时钟信号未产生
- 从设备处于复位状态

**解决**：
- 检查 SCK 引脚连接
- 确认从设备的模式配置
- 检查是否需要先发送命令序列

### 4. DMA 传输失败

**原因**：
- DMA 通道配置错误
- 传输长度设置不正确
- SPI 和 DMA 时钟未同时使能

**解决**：
- 确认 DMA 通道映射正确
- 每次传输前重新设置 CNDTR
- 确保 DMA 和 SPI 时钟都已使能

## 总结

SPI 协议是嵌入式开发中最重要的通信协议之一。本文档涵盖：

- **协议原理**：四根信号线、全双工同步传输
- **四种工作模式**：CPOL 和 CPHA 的组合
- **寄存器详解**：CR1、CR2、SR、DR 寄存器
- **标准库开发**：GPIO 配置、SPI 初始化、数据收发
- **软件/硬件 NSS**：从设备选择方式
- **DMA 和中断**：高效数据传输方式
- **实际应用**：Flash 读写示例
- **常见问题**：数据错位、通信失败等问题的排查方法

掌握 SPI 协议对于嵌入式开发至关重要，特别是与各种高速外设的通信场景。
