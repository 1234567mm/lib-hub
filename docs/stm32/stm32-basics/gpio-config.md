---
title: GPIO配置详解
---

# GPIO配置详解

本文系统讲解 STM32 GPIO（通用输入输出）的工作原理、8种模式、寄存器配置及标准库使用方法。

---

## 一、GPIO 是什么

GPIO 是 General Purpose Input Output 的缩写，即**通用输入输出端口**。它是 MCU 与外部世界交互的最基本接口，可以：

- **输入模式**：读取外部信号（按键、传感器电平）
- **输出模式**：驱动外部设备（LED、继电器、蜂鸣器）
- **复用功能**：连接片上外设（UART、SPI、I2C 等）

---

## 二、GPIO 基本结构

### 2.1 典型 GPIO 内部结构

STM32 GPIO 内部结构包含以下几部分：

```
         ┌─────────────────────────────────────┐
         │           VDD (上拉时)              │
         │                 ↑                   │
         │            ┌────┴────┐              │
         │            │ 上拉电阻 │              │
         │            └────┬────┘              │
         │                 ↑                   │
    ─────┤───→ 保护二极管  │  I/O引脚  │  ──────┼─────→ 外部线路
         │            ┌────┴────┐              │
         │            │ 下拉电阻 │              │
         │            └────┬────┘              │
         │                 ↓                   │
         │           VSS (下拉时)              │
         └─────────────────────────────────────┘
                         ↓
              ┌───────────────────────┐
              │    施密特触发器       │
              │   (信号整形)          │
              └───────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │   输入数据寄存器       │
              │    (GPIOx_IDR)         │
              └───────────────────────┘

              ┌───────────────────────┐
              │   输出数据寄存器      │
              │   (GPIOx_ODR)         │
              └───────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │   位设置/清除寄存器   │
              │  (GPIOx_BSRR/BRR)     │
              └───────────┬───────────┘
                          ↓
              ┌───────────────────────┐
              │   输出控制单元        │
              │ (推挽/开漏控制)      │
              └───────────────────────┘
```

### 2.2 保护二极管作用

每个 GPIO 引脚内部有两个保护二极管：

- **上方二极管**：将过高电压钳制到 VDD，防止正极过压损坏芯片
- **下方二极管**：将过低电压钳制到 VSS，防止负压损坏芯片

**正常使用时**：引脚电压应被钳制在 VSS 和 VDD 之间（0~3.3V）。

---

## 三、GPIO 8种工作模式

STM32 GPIO 有 8 种工作模式，分为两大类：**输入模式**和**输出模式**。

### 3.1 输入模式（4种）

| 模式 | 配置值 | 说明 |
|------|--------|------|
| 浮空输入 | 00 | 引脚悬空，电平由外部电路决定 |
| 上拉输入 | 01 | 内部接上拉电阻，默认高电平 |
| 下拉输入 | 10 | 内部接下拉电阻，默认低电平 |
| 模拟输入 | 11 | 关闭施密特触发器，用于ADC |

#### 3.1.1 浮空输入（Input Floating）

```
引脚 ──→ 施密特触发器 ──→ IDR寄存器
        ↑
     引脚悬空
```

**特点**：
- 引脚未接任何内部电阻
- 电平完全由外部电路决定
- **优点**：功耗低，适合低功耗设计
- **缺点**：引脚悬空时电平不确定，易受干扰
- **适用场景**：外部电路能明确提供稳定电平的情况

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.1.2 上拉输入（Input Pull-Up）

```
引脚 ──→ 上拉电阻(约40kΩ) ──→ VDD
                │
                ↓
        施密特触发器 ──→ IDR寄存器
                ↑
             引脚
```

**特点**：
- 内部接上拉电阻到 VDD（3.3V）
- 无外部信号时，引脚默认读取为**高电平**
- **适用场景**：检测按键按下（按键另一端接地，按下为低电平）

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;  // IPU = Input Pull-Up
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.1.3 下拉输入（Input Pull-Down）

```
引脚 ──→ 下拉电阻(约40kΩ) ──→ VSS
                │
                ↓
        施密特触发器 ──→ IDR寄存器
                ↑
             引脚
```

**特点**：
- 内部接下拉电阻到 VSS（GND）
- 无外部信号时，引脚默认读取为**低电平**
- **适用场景**：检测高电平有效的信号

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPD;  // IPD = Input Pull-Down
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.1.4 模拟输入（Input Analog）

**特点**：
- **关闭**施密特触发器
- 引脚直接连接到片上 ADC
- 用于模拟信号采集（电压检测）
- **功耗最低**

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;  // AIN = Analog Input
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

### 3.2 输出模式（4种）

| 模式 | 配置值 | 说明 |
|------|--------|------|
| 推挽输出 | 01 | 能输出高/低电平，驱动能力强 |
| 开漏输出 | 11 | 只能输出低电平，需外接上拉 |
| 复用推挽输出 | 10 | 由片上外设控制，推挽方式 |
| 复用开漏输出 | 11 | 由片上外设控制，开漏方式 |

#### 3.2.1 推挽输出（Output Push-Pull）

```
        ┌──── VDD
        │      │
    ────┤ P-MOS │────→ 高电平输出
        │      │
       引脚     │
    ────┤ N-MOS │────→ 低电平输出
        │      │
        └─── VSS
```

**工作原理**：
- **输出高电平**：P-MOS 导通，N-MOS 截止，输出接近 VDD
- **输出低电平**：P-MOS 截止，N-MOS 导通，输出接近 VSS

**特点**：
- **驱动能力强**（通常 20~25mA，可直接驱动 LED）
- 能主动输出高电平也能主动输出低电平
- **缺点**：两个电平互相“拉扯"，不宜直接并联

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;  // Out Push-Pull
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.2.2 开漏输出（Output Open-Drain）

```
        ┌──── VDD (外接)
        │      │
       引脚 ←───┤ 上拉电阻
        │
    ────┤ N-MOS │────→ 低电平输出 (导通)
        │      │
        └─── VSS
```

**工作原理**：
- **输出低电平**：N-MOS 导通，引脚拉低到 VSS
- **输出高电平**：N-MOS 截止，引脚呈现**高阻态**，靠外接上拉电阻拉高

**特点**：
- **不能主动输出高电平**，只能输出低电平或高阻态
- 需要**外接上拉电阻**才能输出高电平
- 可以**线与**：多个开漏输出可以直接并联，实现"与"逻辑
- **适用场景**：I2C/SMBus 通信、多设备共享总线、电平转换

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD;  // Out Open-Drain
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.2.3 复用推挽输出（Alternate Function Push-Pull）

**特点**：
- 由片上外设（如 UART、SPI）控制输出
- 使用推挽结构，驱动能力强
- **适用场景**：外设需要主动输出高低电平（USART TX、SPI MOSI 等）

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;  // Alternate Function Push-Pull
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

#### 3.2.4 复用开漏输出（Alternate Function Open-Drain）

**特点**：
- 由片上外设控制输出
- 使用开漏结构，需要外接上拉
- **适用场景**：I2C/SMBus 等开漏要求的协议

**配置方法**：
```c
GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;  // I2C1 SCL/SDA
GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;  // Alternate Function Open-Drain
GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
GPIO_Init(GPIOA, &GPIO_InitStructure);
```

---

## 四、GPIO 寄存器详解

### 4.1 寄存器映射（以GPIOA为例）

| 寄存器 | 地址偏移 | 说明 |
|--------|----------|------|
| GPIOA_CRL | 0x00 | 端口配置低寄存器（Pin 0-7） |
| GPIOA_CRH | 0x04 | 端口配置高寄存器（Pin 8-15） |
| GPIOA_IDR | 0x08 | 端口输入数据寄存器 |
| GPIOA_ODR | 0x0C | 端口输出数据寄存器 |
| GPIOA_BSRR | 0x10 | 端口位设置/清除寄存器 |
| GPIOA_BRR | 0x14 | 端口位清除寄存器 |
| GPIOA_LCKR | 0x18 | 端口配置锁定寄存器 |
| GPIOA_ODR | 0x0C | 端口输出数据寄存器（兼容） |

### 4.2 端口配置寄存器（GPIOx_CRL / GPIOx_CRH）

每个引脚需要 2 位配置：

| CNFy[1:0] | 模式 | 含义 |
|-----------|------|------|
| 00 | 输入模式 | 模拟输入 |
| 01 | 输入模式 | 浮空输入 |
| 10 | 输入模式 | 上拉/下拉输入 |
| 11 | 输入模式 | 保留 |

| CNFy[1:0] | 模式 | 含义 |
|-----------|------|------|
| 00 | 输出模式 | 推挽输出 |
| 01 | 输出模式 | 复用推挽输出 |
| 10 | 输出模式 | 复用开漏输出 |
| 11 | 输出模式 | 开漏输出 |

**速度配置（MODEy[1:0]）**：

| MODEy[1:0] | 速度 |
|-----------|------|
| 00 | 输入模式 |
| 01 | 10MHz |
| 10 | 2MHz |
| 11 | 50MHz |

**配置示例：PA0 配置为推挽输出，50MHz**
```c
// GPIOA_CRL 地址 = GPIOA_BASE + 0x00
// PA0 对应 CRL 的 bit[1:0] (MODEy) 和 bit[3:2] (CNFy)
// MODE0[1:0] = 11 (50MHz), CNF0[1:0] = 00 (推挽输出)

RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;  // 使能GPIOA时钟

GPIOA->CRL &= ~(0x0F << (0 * 4));     // 清除PA0配置
GPIOA->CRL |= (0x03 << (0 * 4));      // MODE0 = 11 (50MHz)
GPIOA->CRL |= (0x00 << (2 + 0 * 4)); // CNF0 = 00 (推挽输出)
```

**配置示例：PA0 配置为上拉输入**
```c
// 输入模式：MODE0 = 00
// CNF0 = 10 (上拉/下拉)
// ODR0 = 1 表示上拉，ODR0 = 0 表示下拉

GPIOA->CRL &= ~(0x0F << (0 * 4));     // MODE0 = 00 (输入模式)
GPIOA->CRL |= (0x02 << (2 + 0 * 4)); // CNF0 = 10 (上拉/下拉)
GPIOA->ODR |= (0x01 << 0);            // ODR0 = 1 (上拉)
```

### 4.3 端口输入数据寄存器（GPIOx_IDR）

**只读寄存器**，读取引脚的当前电平状态。

| 位 | 说明 |
|----|------|
| IDR[15:0] | 引脚0-15的当前输入电平 |

**读取示例**：
```c
uint16_t pins_status = GPIOA->IDR;  // 读取GPIOA所有引脚状态

// 读取特定引脚
if (pins_status & GPIO_Pin_0) {
    // PA0 为高电平
} else {
    // PA0 为低电平
}
```

### 4.4 端口输出数据寄存器（GPIOx_ODR）

**读写寄存器**，控制输出引脚的电平。

| 位 | 说明 |
|----|------|
| ODR[15:0] | 引脚0-15的输出电平（0=低，1=高） |

**写入示例**：
```c
GPIOA->ODR |= GPIO_Pin_0;    // PA0 输出高电平
GPIOA->ODR &= ~GPIO_Pin_0;   // PA0 输出低电平
```

### 4.5 端口位设置/清除寄存器（GPIOx_BSRR）

**推荐使用的原子操作寄存器**，解决 ODR 读-改-写的问题。

| 位 | 说明 |
|----|------|
| BS[15:0] | 置位对应位（1=输出高） |
| BR[15:0] | 清除对应位（1=输出低） |

**优点**：BS 和 BR 是独立的，可以**原子地**设置或清除单个引脚。

**使用示例**：
```c
GPIOA->BSRR = GPIO_Pin_0;     // PA0 输出高电平（原子操作）
GPIOA->BSRR = GPIO_Pin_0 << 16; // PA0 输出低电平（原子操作）

// 等价于：
GPIOA->BSRR = (1 << 0);           // 置位
GPIOA->BSRR = (1 << (0 + 16));    // 清除
```

### 4.6 端口位清除寄存器（GPIOx_BRR）

与 BSRR 的 BR 域功能相同，是 BSRR 的简化版本。

| 位 | 说明 |
|----|------|
| BR[15:0] | 清除对应位（1=输出低） |

**使用示例**：
```c
GPIOA->BRR = GPIO_Pin_0;  // PA0 输出低电平
```

---

## 五、GPIO 电路基础

### 5.1 推挽输出 vs 开漏输出

| 特性 | 推挽输出 | 开漏输出 |
|------|----------|----------|
| 输出高电平 | 能主动输出 | 依赖外部上拉 |
| 输出低电平 | 能主动输出 | 能主动输出 |
| 驱动能力 | 强 | 弱（受上拉限制） |
| 可并联 | 不可直接并联 | 可以线与 |
| 功耗 | 较高（有静态电流） | 较低 |
| 典型应用 | LED、驱动电路 | I2C、开漏中断 |

### 5.2 上拉/下拉电阻的作用

**上拉电阻（Pull-Up）**：
- 将不确定的信号拉至高电平
- 典型值：4.7kΩ~10kΩ
- 作用：
  - 提供默认高电平
  - 增强驱动能力
  - 限制电流

**下拉电阻（Pull-Down）**：
- 将不确定的信号拉至低电平
- 典型值：4.7kΩ~10kΩ

**电阻值选择原则**：
- **太大**：漏电流小，但噪声敏感，上升沿慢
- **太小**：驱动能力强，但功耗大
- **常用值**：4.7kΩ（平衡功耗和速度）

### 5.3 GPIO 驱动 LED

**连接方式**：
```
方式1：低电平驱动（常用）
VDD ──→ LED ──→ 限流电阻 ──→ PA0
                      │
                      ↓
                 低电平点亮

方式2：高电平驱动
PA0 ──→ 限流电阻 ──→ LED ──→ VSS
                      │
                      ↓
                 高电平点亮
```

**限流电阻计算**：
```c
// 假设 LED 正向压降 2V，电流 10mA，VDD=3.3V
// R = (VDD - LED压降) / 电流 = (3.3 - 2) / 0.01 = 130Ω
// 常用 150Ω 或 220Ω
```

**代码实现**：
```c
// 低电平驱动 LED（LED阳极接VDD，阴极通过电阻接PA0）
#define LED_PIN GPIO_Pin_0

void LED_Init(void) {
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = LED_PIN;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    GPIO_SetBits(GPIOA, LED_PIN);  // 默认熄灭（低电平驱动）
}

void LED_On(void) {
    GPIO_ResetBits(GPIOA, LED_PIN);  // 点亮
}

void LED_Off(void) {
    GPIO_SetBits(GPIOA, LED_PIN);    // 熄灭
}

void LED_Toggle(void) {
    if (GPIO_ReadOutputDataBit(GPIOA, LED_PIN) == Bit_SET) {
        GPIO_ResetBits(GPIOA, LED_PIN);
    } else {
        GPIO_SetBits(GPIOA, LED_PIN);
    }
}
```

### 5.4 GPIO 读取按键

**连接方式**：
```
方式1：低电平触发（按键接GND，另一端接PA0）
PA0 ──→ 限流电阻(10kΩ) ──→ VDD (上拉)
                │
                ↓
           按键 ──→ GND
                │
                ↓
           按下时：PA0被拉低
```

**代码实现**：
```c
#define KEY_PIN GPIO_Pin_0

void KEY_Init(void) {
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = KEY_PIN;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;  // 上拉输入
    GPIO_Init(GPIOA, &GPIO_InitStructure);
}

uint8_t Key_Scan(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin) {
    if (GPIO_ReadInputDataBit(GPIOx, GPIO_Pin) == Bit_RESET) {
        delay_ms(10);  // 消抖
        if (GPIO_ReadInputDataBit(GPIOx, GPIO_Pin) == Bit_RESET) {
            while (GPIO_ReadInputDataBit(GPIOx, GPIO_Pin) == Bit_RESET);  // 等待释放
            return 1;
        }
    }
    return 0;
}
```

---

## 六、复用功能（AFIO）

### 6.1 什么是复用功能

STM32 的引脚数量有限，一个引脚可能同时连接多个外设。**复用功能（AFIO）** 允许 GPIO 引脚作为片上外设的功能引脚使用。

### 6.2 复用功能映射

STM32F103 的主要复用功能：

| 引脚 | AFIO 功能 |
|------|-----------|
| PA9 | USART1_TX |
| PA10 | USART1_RX |
| PA6 | SPI1_MISO |
| PA7 | SPI1_MOSI |
| PA5 | SPI1_SCK |
| PB6 | I2C1_SCL |
| PB7 | I2C1_SDA |
| PA0 | ADC1_IN0 |
| PA1 | ADC1_IN1 |

### 6.3 复用功能配置步骤

```c
// 配置 PA9 为 USART1_TX（复用推挽输出）
void USART1_GPIO_Config(void) {
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_AFIO, ENABLE);
    
    GPIO_InitTypeDef GPIO_InitStructure;
    
    // USART1_TX = PA9，配置为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // USART1_RX = PA10，配置为浮空输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
}
```

### 6.4 复用功能重映射

有些外设可能有**多个引脚可选**，可以通过 AFIO 重映射到其他引脚。

**示例：TIM2 通道1 重映射到 PA15**
```c
void TIM2_Remap_Config(void) {
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_AFIO, ENABLE);
    
    // 关闭JTAG-DP，启用SW-DP（释放PA15/PB3/PB4用于GPIO）
    GPIO_PinRemapConfig(GPIO_Remap_SWJ_JTAGDisable, ENABLE);
    
    // TIM2重映射：CH1 -> PA15
    GPIO_PinRemapConfig(GPIO_Remap_TIM2Partial_CH1, ENABLE);
}
```

---

## 七、标准库配置函数

### 7.1 常用函数一览

| 函数 | 说明 |
|------|------|
| GPIO_DeInit() | 复位GPIO外设 |
| GPIO_Init() | 初始化GPIO |
| GPIO_StructInit() | 初始化GPIO_InitTypeDef结构体 |
| GPIO_ReadInputDataBit() | 读取输入引脚电平 |
| GPIO_ReadInputData() | 读取整个端口输入 |
| GPIO_ReadOutputDataBit() | 读取输出引脚电平 |
| GPIO_ReadOutputData() | 读取整个端口输出 |
| GPIO_SetBits() | 设置引脚为高电平 |
| GPIO_ResetBits() | 设置引脚为低电平 |
| GPIO_WriteBit() | 写入指定引脚电平 |
| GPIO_Write() | 写入整个端口 |
| GPIO_PinLockConfig() | 锁定引脚配置 |

### 7.2 GPIO_InitTypeDef 结构体

```c
typedef struct {
    uint16_t GPIO_Pin;      // 引脚号：GPIO_Pin_0~GPIO_Pin_15 或组合
    GPIOSpeed_TypeDef GPIO_Speed;  // 速度：GPIO_Speed_10MHz/2MHz/50MHz
    GPIOMode_TypeDef GPIO_Mode;   // 模式：见下文
} GPIO_InitTypeDef;
```

**GPIOSpeed_TypeDef**：
```c
typedef enum {
    GPIO_Speed_10MHz = 1,
    GPIO_Speed_2MHz,
    GPIO_Speed_50MHz
} GPIOSpeed_TypeDef;
```

**GPIOMode_TypeDef**：
```c
typedef enum {
    GPIO_Mode_AIN = 0x0,          // 模拟输入
    GPIO_Mode_IN_FLOATING = 0x04,  // 浮空输入
    GPIO_Mode_IPD = 0x08,         // 下拉输入
    GPIO_Mode_IPU = 0x08,         // 上拉输入（实际值相同）
    GPIO_Mode_Out_OD = 0x14,      // 开漏输出
    GPIO_Mode_Out_PP = 0x10,      // 推挽输出
    GPIO_Mode_AF_OD = 0x1C,       // 复用开漏输出
    GPIO_Mode_AF_PP = 0x18        // 复用推挽输出
} GPIOMode_TypeDef;
```

### 7.3 完整配置示例

```c
#include "stm32f10x.h"

void GPIO_Configuration(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    
    // 使能GPIOA/GPIOB时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_GPIOB, ENABLE);
    
    // 配置PA0为推挽输出，50MHz（LED1）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 配置PA1为推挽输出，50MHz（LED2）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 配置PB0为上拉输入（按键）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
}

int main(void) {
    GPIO_Configuration();
    
    while (1) {
        if (GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_0) == Bit_RESET) {
            GPIO_SetBits(GPIOA, GPIO_Pin_0);  // 按键按下，LED1灭
        } else {
            GPIO_ResetBits(GPIOA, GPIO_Pin_0);  // 按键松开，LED1亮
        }
    }
}
```

---

## 八、GPIO 常见应用

### 8.1 LED 流水灯

```c
#include "stm32f10x.h"

#define LED_COUNT 4
#define DELAY_MS  500

void delay_ms(uint32_t ms) {
    SysTick->LOAD = 72000 - 1;  // 72MHz / 1000 = 72000
    SysTick->VAL = 0;
    SysTick->CTRL = SysTick_CTRL_CLKSOURCE_Msk | SysTick_CTRL_ENABLE_Msk;
    
    for (uint32_t i = 0; i < ms; i++) {
        while (!(SysTick->CTRL & SysTick_CTRL_COUNTFLAG_Msk));
    }
    SysTick->CTRL = 0;
}

void LED_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    // 配置PA0~PA3为推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1 | GPIO_Pin_2 | GPIO_Pin_3;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 初始全部熄灭
    GPIO_SetBits(GPIOA, GPIO_Pin_0 | GPIO_Pin_1 | GPIO_Pin_2 | GPIO_Pin_3);
}

int main(void) {
    LED_Init();
    
    while (1) {
        for (int i = 0; i < LED_COUNT; i++) {
            GPIO_ResetBits(GPIOA, GPIO_Pin_0 << i);  // 点亮当前LED
            delay_ms(DELAY_MS);
            GPIO_SetBits(GPIOA, GPIO_Pin_0 << i);   // 熄灭当前LED
        }
    }
}
```

### 8.2 蜂鸣器驱动

```c
#include "stm32f10x.h"

#define BEEP_PIN GPIO_Pin_8

void BEEP_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    
    GPIO_InitStructure.GPIO_Pin = BEEP_PIN;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
    
    GPIO_ResetBits(GPIOB, BEEP_PIN);  // 默认关闭
}

void BEEP_On(void) {
    GPIO_SetBits(GPIOB, BEEP_PIN);
}

void BEEP_Off(void) {
    GPIO_ResetBits(GPIOB, BEEP_PIN);
}

void BEEP_Beep(uint32_t ms) {
    BEEP_On();
    delay_ms(ms);
    BEEP_Off();
}

int main(void) {
    BEEP_Init();
    
    while (1) {
        BEEP_Beep(200);  // 蜂鸣200ms
        delay_ms(1000);  // 间隔1秒
    }
}
```

### 8.3 GPIO 位操作实现

```c
// 不使用标准库，手工寄存器操作实现位操作

#define PA_ODR *(volatile uint32_t *)(GPIOA_BASE + 0x0C)
#define PA_IDR *(volatile uint32_t *)(GPIOA_BASE + 0x08)
#define PA_BSRR *(volatile uint32_t *)(GPIOA_BASE + 0x10)

// 输出高电平
#define PA0_HIGH() (PA_BSRR = (1 << 0))

// 输出低电平
#define PA0_LOW() (PA_BSRR = (1 << 16))

// 读取输入电平
#define PA0_READ() ((PA_IDR & (1 << 0)) != 0)
```

---

## 九、注意事项与调试

### 9.1 常见错误

1. **忘记使能GPIO时钟**
   ```c
   // 错误：GPIO未使能，无法正常工作
   GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
   GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
   GPIO_Init(GPIOA, &GPIO_InitStructure);
   
   // 正确：先使能时钟
   RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
   GPIO_Init(GPIOA, &GPIO_InitStructure);
   ```

2. **输入输出模式混淆**
   ```c
   // 读取按键时使用了输出模式
   GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;  // 错误！
   GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;     // 正确
   ```

3. **输出模式不匹配**
   ```c
   // I2C使用推挽输出
   GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;  // 错误！
   GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;   // 正确（开漏）
   ```

### 9.2 调试技巧

1. **使用LED闪烁确认芯片运行**
   ```c
   int main(void) {
       LED_Init();
       while (1) {
           GPIOA->BSRR = GPIO_Pin_0;  // 亮
           delay_ms(500);
           GPIOA->BSRR = GPIO_Pin_0 << 16;  // 灭
           delay_ms(500);
       }
   }
   ```

2. **使用USART输出调试信息**
   ```c
   printf("GPIOA_IDR = 0x%04X\r\n", GPIOA->IDR);
   ```

3. **使用Logic Analyzer分析时序**
   - 设置引脚输出方波
   - 用逻辑分析仪观察上升/下降沿时间
   - 验证GPIO响应速度

### 9.3 GPIO 功耗考虑

| 模式 | 典型电流 | 适用场景 |
|------|----------|----------|
| 模拟输入 | < 1μA | ADC、 低功耗设备 |
| 浮空输入 | 约 1μA | 外部有确定电平 |
| 上拉输入 | 约 25μA | 按键检测 |
| 推挽输出 | 约 5mA（50MHz） | LED、驱动 |

**低功耗设计建议**：
- 不使用的引脚配置为**输入浮空**或**模拟输入**
- 避免引脚悬空（导致漏电流）
- 降低输出速度（10MHz足够用于LED控制）

---

## 十、总结

| 知识点 | 重点内容 |
|--------|----------|
| 8种模式 | 浮空/上拉/下拉/模拟输入，推挽/开漏/复用推挽/复用开漏输出 |
| 推挽 vs 开漏 | 推挽能输出高低，开漏需外加上拉，可线与 |
| 核心寄存器 | CRL/CRH（配置），IDR（输入），ODR/BSRR（输出） |
| 配置步骤 | 使能时钟 → 配置模式 → 配置速度 |
| 复用功能 | 外设通过GPIO引脚输出，需配置为AF模式 |
