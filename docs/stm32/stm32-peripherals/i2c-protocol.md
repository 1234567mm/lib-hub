---
title: I2C 协议
---

I2C（Inter-Integrated Circuit，原名 Inter-IC）是一种短距离串行通信协议，由 Philips 公司开发。由于其简单的两线制设计（时钟线 SCL 和数据线 SDA），I2C 协议被广泛应用于连接微控制器与各种外设，如传感器、EEPROM、RTC、AD/DA 转换器等。

## I2C 协议原理

### 两线制接口

I2C 仅使用两根信号线：

| 信号线 | 全称 | 说明 |
|--------|------|------|
| SCL    | Serial Clock | 时钟线，由主设备产生 |
| SDA    | Serial Data  | 数据线，双向传输 |

### 开漏输出与上拉电阻

I2C 总线要求 SDA 和 SCL 必须使用开漏（Open-Drain）输出模式，并通过上拉电阻连接到正电源：

```
        VCC
         │
         ├─ Rp (上拉电阻 4.7k~10kΩ)
         │
    ┌────┴────┐
    │   SDA   │ ← 开漏输出
    └────┬────┘
         │
    ┌────┴────┐
    │  设备1   │ ← I2C 器件
    │  设备2   │
    │   ...   │
    └─────────┘
```

**为什么使用开漏输出？**
-允许多个设备共享同一总线而不产生电平冲突
- 实现"线与"功能：任一设备拉低，总线即为低电平
- 支持仲裁和时钟同步

### 推挽输出 vs 开漏输出

| 模式 | 能主动输出 | 能主动输出 | 适用场景 |
|------|------------|------------|----------|
| 推挽输出 | 高电平 | 低电平 | 单设备驱动 |
| 开漏输出 | 高电平（需上拉） | 低电平 | 多设备共享总线 |

## I2C 时序

### 空闲状态

当总线没有进行任何传输时，SCL 和 SDA 都处于高电平状态（被各自的上拉电阻拉高）。

### 起始条件（Start Condition）

起始条件由主设备发起：SDA 线从高电平切换到低电平，然后 SCL 线从高电平切换到低电平。

```
     空闲                    起始条件
SDA ──────────┐    ┌─────────────
               └────┘  (SDA 由高变低)

SCL ───────────────┐
                   └─────────────
                   (SCL 保持高后变低)
```

### 停止条件（Stop Condition）

停止条件由主设备发起：SCL 线从低电平切换到高电平，然后 SDA 线从低电平切换到高电平。

```
     停止条件
SDA ────────────────┐
                    └────────────
SCL ───────────────────────┐
                          └────
```

### 数据有效性

I2C 的数据采样发生在 SCL 的高电平期间。在 SCL 为高电平时，SDA 线上的电平必须保持稳定：

```
         ┌───┐
SCL ─────┘   └──────
              ↑ 采样点

         ┌───┐
SDA ─────┘ X └──────
         ↑ 保持稳定
```

**SDA 在 SCL 高电平期间的变化表示：**
- 从高到低 = 起始条件
- 从低到高 = 停止条件

### 数据传输格式

每个字节（8位）后面跟随一个应答位（ACK/NACK）：

```
    8 bits数据           ACK/NACK
┌──────────────────┐   ┌────┐
│ D7  D6  D5  D4  D3  D2  D1  D0 │  │ ACK │
└──────────────────┘   └────┘
                               ↑
                          第9个时钟周期
```

**MSB 在前**（Most Significant Bit 先传输）

### 应答机制（ACK/NACK）

**应答位（ACK）**：
- 发送方在第9个时钟周期释放 SDA 线（设为高阻态）
- 接收方在 SCL 的高电平期间将 SDA 拉低
- 表示数据已被正确接收

**非应答位（NACK）**：
- 接收方在第9个时钟周期保持 SDA 为高电平
- 可能的原因：
  - 接收方不希望接收更多数据
  - 发送方发送的地址没有设备响应
  - 接收方在接收过程中发生错误

### 完整的数据传输过程

```
1. 主机发送 START 条件
2. 主机发送 7 位地址 + R/W 位
3. 主机释放 SDA，等待从机 ACK
4. (如果是写操作) 主机发送 8 位数据，等待 ACK
5. (如果是读操作) 从机发送 8 位数据，主机发送 ACK
6. 重复步骤 4 或 5，可以传输多个字节
7. 主机发送 STOP 条件
```

## I2C 地址

### 7位地址格式

I2C 设备使用 7 位地址（不包括 R/W 位）：

```
  6  5  4  3  2  1  0
┌──┬──┬──┬──┬──┬──┬──┐
│  设备地址    │R/W│
└──┴──┴──┴──┴──┴──┴──┘
```

### 常见设备的 I2C 地址

| 设备 | 典型地址（7位） | 说明 |
|------|----------------|------|
| OLED SSD1306 | 0x3C 或 0x3D | 128x64 OLED 显示屏 |
| MPU6050 | 0x68 或 0x69 | 六轴加速度计/陀螺仪 |
| BMP180 | 0x77 | 气压传感器 |
| AT24C02 | 0x50~0x57 | 256 字节 EEPROM |
| PCF8574 | 0x20~0x27 | I/O 扩展芯片 |
| ADS1115 | 0x48~0x4B | 16 位 ADC |

### 10位地址格式

I2C 还支持 10 位地址，使用两个字节传输：

```
First byte: 1111 0XX + R/W
Second byte: XXXXXXXX
```

## STM32 I2C 寄存器详解

### I2C_CR1 - 控制寄存器 1

| 位 | 名称 | 说明 |
|----|------|------|
| 15 | SWRST | 软件复位 |
| 14 | SMBUS | SMBUS 模式（0=I2C 模式） |
| 10 | SMBTYPE | SMBus 类型 |
| 9  | ENARP | ARP 使能 |
| 8  | PEC   | PEC 使能 |
| 7  | POS   | 应答/PEC 位置 |
| 6  | ACK   | 应答使能 |
| 5  | STOP  | 停止条件生成 |
| 4  | START | 起始条件生成 |
| 3  | NOSTRETCH | 时钟拉伸禁止 |
| 2  | ENGC  | 广播呼叫使能 |
| 1  | ENPEC | PEC 校验使能 |
| 0  | PE    | I2C 使能 |

### I2C_CR2 - 控制寄存器 2

| 位 | 名称 | 说明 |
|----|------|------|
| 12:6 | FREQ[5:0] | I2C 时钟频率（MHz） |
| 5  | ITERREN  | 错误中断使能 |
| 4  | ITEVTEN  | 事件中断使能 |
| 3  | ITBUFEN  | 缓冲区中断使能 |
| 2  | DMAEN    | DMA 请求使能 |
| 1  | LAST     | DMA 最后一次传输 |
| 0  | DMAEN    | DMA 使能（重复） |

### I2C_SR1 - 状态寄存器 1

| 位 | 名称 | 说明 |
|----|------|------|
| 15 | SMBALERT | SMBus 报警 |
| 14 | TIMEOUT  | 超时标志 |
| 12 | PECERR   | PEC 错误 |
| 11 | OVR      | 过载/欠载 |
| 10 | AF       | 应答失败 |
| 9  | ARLO     | 仲裁丢失 |
| 8  | BERR     | 总线错误 |
| 7  | TxE      | 数据寄存器空（发送） |
| 6  | RxNE     | 数据寄存器非空（接收） |
| 2  | ADD10    | 10 位地址已发送 |
| 1  | ITC      | 抢占/停止检测 |
| 0  | SB       | 起始位（主模式） |

### I2C_SR2 - 状态寄存器 2

| 位 | 名称 | 说明 |
|----|------|------|
| 15:8 | PEC[7:0] | PEC 值 |
| 7  | DUALF    | 双地址标志 |
| 6  | SMBHOST  | SMBus 主机头 |
| 5  | SMBDEFAULT | SMBus 默认地址 |
| 4  | GENCALL  | 广播呼叫地址标志 |
| 2  | TRA      | 发送/接收模式 |
| 1  | BUSY     | 总线忙 |
| 0  | MSL      | 主/从模式（1=主） |

### I2C_DR - 数据寄存器

- 发送时：写入数据自动启动发送
- 接收时：读取 DR 获取接收数据

### I2C_CCR - 时钟控制寄存器

| 位 | 名称 | 说明 |
|----|------|------|
| 15 | F/S     | 模式选择：0=标准模式，1=快速模式 |
| 14 | DUTY    | 快速模式占空比：0=2:1，1=16:9 |
| 11:0 | CCR[11:0] | 时钟分频系数 |

**标准模式（100kHz）计算**：
```
T_high = CCR * t_pclk1
T_low = CCR * t_pclk1
I2C 时钟周期 = 2 * CCR * t_pclk1
CCR = PCLK1 / (2 * 100000)
```

**快速模式（400kHz，2:1 占空比）计算**：
```
CCR = PCLK1 / (3 * 400000)
```

### I2C_TRISE - 上升沿时间寄存器

设置最大上升时间：
- 标准模式：1000ns
- 快速模式：300ns

```
TRISE = (最大上升时间 / t_pclk1) + 1
```

## STM32 标准库配置

### GPIO 配置

I2C1 引脚映射：
| 功能 | GPIO |
|------|------|
| SCL | PB6 |
| SDA | PB7 |

或复用映射：
| 功能 | GPIO |
|------|------|
| SCL | PB8 |
| SDA | PB9 |

```c
void I2C1_GPIO_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);

    // 配置 PB6, PB7 为复用开漏输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;  // 复用开漏
    GPIO_Init(GPIOB, &GPIO_InitStructure);
}
```

### I2C 初始化

```c
void I2C1_Config(void)
{
    I2C_InitTypeDef I2C_InitStructure;

    // I2C 配置
    I2C_InitStructure.I2C_Mode = I2C_Mode_I2C;              // I2C 模式
    I2C_InitStructure.I2C_DutyCycle = I2C_DutyCycle_2;     // 2:1 占空比（快速模式）
    I2C_InitStructure.I2C_OwnAddress1 = 0x00;               // 主设备自己的地址（不使用从模式）
    I2C_InitStructure.I2C_Ack = I2C_Ack_Enable;             // 使能应答
    I2C_InitStructure.I2C_AcknowledgedAddress = I2C_AcknowledgedAddress_7bit;  // 7位地址模式
    I2C_InitStructure.I2C_ClockSpeed = 400000;              // 400kHz 快速模式

    I2C_Init(I2C1, &I2C_InitStructure);
    I2C_Cmd(I2C1, ENABLE);
}
```

### 完整初始化

```c
void I2C1_Init(void)
{
    I2C1_GPIO_Config();
    I2C1_Config();
}
```

## I2C 通信函数

### 等待事件

```c
// 等待指定事件超时
ErrorStatus I2C_WaitEvent(I2C_TypeDef* I2Cx, uint32_t event, uint32_t timeout)
{
    uint32_t tickstart = GetTick();

    while (!I2C_CheckEvent(I2Cx, event))
    {
        if ((GetTick() - tickstart) > timeout)
            return ERROR;
    }
    return SUCCESS;
}
```

### 发送起始条件

```c
void I2C_Start(I2C_TypeDef* I2Cx)
{
    // 发送起始条件
    I2C_GenerateSTART(I2Cx, ENABLE);

    // 等待 EV5: 起始条件已发送
    while (!I2C_CheckEvent(I2Cx, I2C_EVENT_MASTER_MODE_SELECT));
}
```

### 发送设备地址

```c
void I2C_SendAddress(I2C_TypeDef* I2Cx, uint8_t addr, uint8_t direction)
{
    // 发送地址 + 方向位
    // direction: I2C_Direction_Transmitter (0) = 写
    // direction: I2C_Direction_Receiver (1) = 读
    I2C_Send7bitAddress(I2Cx, addr, direction);

    // 等待 EV6: 地址已发送
    if (direction == I2C_Direction_Transmitter)
    {
        while (!I2C_CheckEvent(I2Cx, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED));
    }
    else
    {
        while (!I2C_CheckEvent(I2Cx, I2C_EVENT_MASTER_RECEIVER_MODE_SELECTED));
    }
}
```

### 发送停止条件

```c
void I2C_Stop(I2C_TypeDef* I2Cx)
{
    I2C_GenerateSTOP(I2Cx, ENABLE);
}
```

### 发送一个字节

```c
void I2C_SendByte(I2C_TypeDef* I2Cx, uint8_t data)
{
    // 等待 TXE: 数据寄存器空
    while (!I2C_CheckEvent(I2Cx, I2C_EVENT_MASTER_BYTE_TRANSMITTING));
    I2C_SendData(I2Cx, data);
}
```

### 接收一个字节

```c
uint8_t I2C_ReceiveByte(I2C_TypeDef* I2Cx)
{
    // 等待 RXNE: 数据寄存器非空
    while (!I2C_CheckEvent(I2Cx, I2C_EVENT_MASTER_BYTE_RECEIVED));
    return I2C_ReceiveData(I2Cx);
}
```

### 发送应答位

```c
void I2C_AcknowledgeConfig(I2C_TypeDef* I2Cx, FunctionalState NewState)
{
    I2C_AcknowledgeConfig(I2Cx, NewState);
}
```

## 完整读写操作

### 写入单个字节

```c
/**
 * 向 I2C 设备的指定寄存器写入一个字节
 * @param I2Cx: I2C 端口
 * @param addr: 设备地址（7位，不含R/W位）
 * @param reg:  寄存器地址
 * @param data: 要写入的数据
 */
void I2C_WriteReg(I2C_TypeDef* I2Cx, uint8_t addr, uint8_t reg, uint8_t data)
{
    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Transmitter);
    I2C_SendByte(I2Cx, reg);
    I2C_SendByte(I2Cx, data);
    I2C_Stop(I2Cx);
}
```

### 读取单个字节

```c
/**
 * 从 I2C 设备的指定寄存器读取一个字节
 * @param I2Cx: I2C 端口
 * @param addr: 设备地址（7位，不含R/W位）
 * @param reg:  寄存器地址
 * @return 读取的数据
 */
uint8_t I2C_ReadReg(I2C_TypeDef* I2Cx, uint8_t addr, uint8_t reg)
{
    uint8_t data;

    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Transmitter);
    I2C_SendByte(I2Cx, reg);

    // 切换到接收模式
    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Receiver);

    // 接收数据后发送 NACK 和 STOP
    data = I2C_ReceiveByte(I2Cx);
    I2C_AcknowledgeConfig(I2Cx, DISABLE);
    I2C_Stop(I2Cx);

    return data;
}
```

### 写入多个字节

```c
/**
 * 向 I2C 设备连续写入多个字节
 * @param I2Cx: I2C 端口
 * @param addr: 设备地址
 * @param reg:  起始寄存器地址
 * @param len:  要写入的字节数
 * @param data: 数据缓冲区
 */
void I2C_WriteBuffer(I2C_TypeDef* I2Cx, uint8_t addr, uint8_t reg,
                     uint16_t len, uint8_t *data)
{
    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Transmitter);
    I2C_SendByte(I2Cx, reg);

    for (uint16_t i = 0; i < len; i++)
    {
        I2C_SendByte(I2Cx, data[i]);
    }

    I2C_Stop(I2Cx);
}
```

### 读取多个字节

```c
/**
 * 从 I2C 设备连续读取多个字节
 * @param I2Cx: I2C 端口
 * @param addr: 设备地址
 * @param reg:  起始寄存器地址
 * @param len:  要读取的字节数
 * @param data: 数据缓冲区
 */
void I2C_ReadBuffer(I2C_TypeDef* I2Cx, uint8_t addr, uint8_t reg,
                    uint16_t len, uint8_t *data)
{
    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Transmitter);
    I2C_SendByte(I2Cx, reg);

    // 切换到接收模式
    I2C_Start(I2Cx);
    I2C_SendAddress(I2Cx, addr, I2C_Direction_Receiver);

    // 接收数据
    for (uint16_t i = 0; i < len; i++)
    {
        if (i == len - 1)
        {
            // 最后一个字节，发送 NACK
            data[i] = I2C_ReceiveByte(I2Cx);
            I2C_AcknowledgeConfig(I2Cx, DISABLE);
        }
        else
        {
            data[i] = I2C_ReceiveByte(I2Cx);
            I2C_AcknowledgeConfig(I2Cx, ENABLE);
        }
    }

    I2C_Stop(I2Cx);
}
```

## 实际应用示例

### MPU6050 传感器

MPU6050 是一款六轴加速度计和陀螺仪传感器：

```c
#define MPU6050_ADDR  0x68  // AD0 引脚接地时为 0x68，接高时为 0x69

// MPU6050 寄存器地址
#define MPU6050_PWR_MGMT_1    0x6B
#define MPU6050_ACCEL_XOUT_H   0x3B
#define MPU6050_GYRO_XOUT_H    0x43

void MPU6050_Init(void)
{
    // 唤醒 MPU6050
    I2C_WriteReg(I2C1, MPU6050_ADDR, MPU6050_PWR_MGMT_1, 0x00);
}

int16_t MPU6050_ReadWord(uint8_t reg)
{
    uint8_t high = I2C_ReadReg(I2C1, MPU6050_ADDR, reg);
    uint8_t low = I2C_ReadReg(I2C1, MPU6050_ADDR, reg + 1);
    return (int16_t)(high << 8) | low;
}

void MPU6050_ReadAll(int16_t *ax, int16_t *ay, int16_t *az,
                     int16_t *gx, int16_t *gy, int16_t *gz)
{
    *ax = MPU6050_ReadWord(MPU6050_ACCEL_XOUT_H);
    *ay = MPU6050_ReadWord(MPU6050_ACCEL_XOUT_H + 2);
    *az = MPU6050_ReadWord(MPU6050_ACCEL_XOUT_H + 4);
    *gx = MPU6050_ReadWord(MPU6050_GYRO_XOUT_H);
    *gy = MPU6050_ReadWord(MPU6050_GYRO_XOUT_H + 2);
    *gz = MPU6050_ReadWord(MPU6050_GYRO_XOUT_H + 4);
}
```

### AT24C02 EEPROM

AT24C02 是一款 2Kbit（256字节）的 EEPROM：

```c
#define AT24C02_ADDR  0x50  // A0, A1, A2 都接地时

void AT24C02_WriteByte(uint8_t addr, uint8_t data)
{
    I2C_WriteReg(I2C1, AT24C02_ADDR, addr, data);
    delay_ms(10);  // 等待写入完成
}

uint8_t AT24C02_ReadByte(uint8_t addr)
{
    return I2C_ReadReg(I2C1, AT24C02_ADDR, addr);
}

void AT24C02_WritePage(uint8_t page, uint8_t *data, uint8_t len)
{
    uint8_t addr = page * 8;  // AT24C02 每页 8 字节
    I2C_WriteBuffer(I2C1, AT24C02_ADDR, addr, len, data);
    delay_ms(10);
}
```

### OLED SSD1306 显示屏

```c
#define OLED_ADDR  0x3C

#define OLED_CMD   0x00  // 命令模式
#define OLED_DATA  0x40  // 数据模式

void OLED_SendCommand(uint8_t cmd)
{
    I2C_WriteReg(I2C1, OLED_ADDR, OLED_CMD, cmd);
}

void OLED_SendData(uint8_t data)
{
    I2C_WriteReg(I2C1, OLED_ADDR, OLED_DATA, data);
}

void OLED_Init(void)
{
    OLED_SendCommand(0xAE);  // 关闭显示
    OLED_SendCommand(0xD5);  // 设置时钟分频
    OLED_SendCommand(0x80);
    OLED_SendCommand(0xA8);  // 设置驱动路数
    OLED_SendCommand(0x3F);
    OLED_SendCommand(0xD3);  // 设置显示偏移
    OLED_SendCommand(0x00);
    OLED_SendCommand(0x40);  // 设置显示开始行
    OLED_SendCommand(0xA1);  // 段重映射
    OLED_SendCommand(0xC8);  // COM 扫描方向
    OLED_SendCommand(0xDA);  // COM 引脚设置
    OLED_SendCommand(0x12);
    OLED_SendCommand(0x81);  // 对比度设置
    OLED_SendCommand(0xCF);
    OLED_SendCommand(0xD9);  // 设置预充电周期
    OLED_SendCommand(0xF1);
    OLED_SendCommand(0xDB);  // 设置 VCOMH 电压
    OLED_SendCommand(0x30);
    OLED_SendCommand(0x8D);  // 开启电荷泵
    OLED_SendCommand(0x14);
    OLED_SendCommand(0xAF);  // 开启显示
}
```

## DMA 模式

```c
void I2C1_DMA_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // I2C1_TX -> DMA1 Channel 6
    // I2C1_RX -> DMA1 Channel 7

    // DMA 发送配置
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&I2C1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)i2c_tx_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStructure.DMA_BufferSize = I2C_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel6, &DMA_InitStructure);

    // 使能 I2C DMA 请求
    I2C_DMACmd(I2C1, ENABLE);
}
```

## 常见问题

### 1. 总线一直处于 busy 状态

**原因**：之前的通信未正确结束

**解决**：
```c
// 软件复位 I2C
I2C_SoftwareResetCmd(I2C1, ENABLE);
I2C_SoftwareResetCmd(I2C1, DISABLE);
```

### 2. 找不到设备（ACK 失败）

**排查步骤**：
1. 检查设备地址是否正确
2. 检查 SDA/SCL 引脚连接
3. 检查上拉电阻是否连接
4. 确认设备已供电
5. 使用示波器/逻辑分析仪检查总线信号

### 3. 数据读取错误

**可能原因**：
- 读取时未正确切换方向
- 应答位配置错误
- 最后字节未发送 NACK

### 4. 通信速度不稳定

**解决**：
- 检查上拉电阻值（过大的电阻会导致上升沿缓慢）
- 标准模式建议 4.7kΩ，快速模式建议 2.2kΩ

## 总结

I2C 协议是嵌入式开发中不可或缺的通信方式：

- **两线制**：SCL + SDA，简单高效
- **开漏输出**：需要上拉电阻，支持多设备共享
- **主从模式**：主设备控制总线，从设备被动响应
- **7位/10位地址**：支持大量设备连接
- **速度模式**：标准模式（100kHz）、快速模式（400kHz）
- **应答机制**：可靠的确认机制

掌握 I2C 协议对于使用各种传感器和外设至关重要。
