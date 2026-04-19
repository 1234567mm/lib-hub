---
title: STM32 时钟系统（Clock System）
authors: 山药泥酸奶
tags: [STM32, 嵌入式, ARM, 时钟, RCC]
date: 2024-10-15
slug: stm32-clock-system
---

> STM32F103 系列 | 时钟树 / RCC寄存器 / 标准库函数

---

## 目录

<!-- 目录使用自动生成的锚点，避免断链问题 -->

---

# 1. 时钟体系概述

## 1.1 STM32为什么需要复杂的时钟系统

STM32 的时钟不是"单一时钟"，而是一个复杂的**时钟树（Clock Tree）**。

为什么需要这么复杂？因为不同模块对时钟的需求不同：

- **CPU** 要跑主频
- **定时器** 要计时
- **串口** 要波特率
- **ADC** 要采样时钟
- **RTC** 要低速稳定时钟
- **USB** 要固定频率时钟

所以 STM32 必须设计一整套：**时钟源 → 倍频 → 分频 → 分配 → 开关控制**，这就是 RCC 的核心职责。

> **核心认知**：STM32 不是"一个时钟"，而是"一棵时钟树"。

## 1.2 时钟源分类（HSI/HSE/LSI/LSE）

STM32 常见有两大类时钟源：

### 高速时钟（HSx）

| 时钟 | 全称 | 类型 | 频率 | 特点 |
|------|------|------|------|------|
| **HSI** | High Speed Internal | 内部 RC 振荡器 | 8 MHz | 上电即用，不需外部硬件 |
| **HSE** | High Speed External | 外部晶振 | 4~25 MHz | 精度高，需外部晶振 |

### 低速时钟（LSx）

| 时钟 | 全称 | 类型 | 频率 | 特点 |
|------|------|------|------|------|
| **LSI** | Low Speed Internal | 内部 RC 振荡器 | 约 40 kHz | 给 RTC、独立看门狗供时钟 |
| **LSE** | Low Speed External | 外部晶振 | 32.768 kHz | 精度高，适合 RTC |

## 1.3 内部时钟与外部时钟对比

### 内部时钟（HSI/LSI）

**优点**：
- 不需要外部晶振
- 上电即可使用
- 成本低，设计简单

**缺点**：
- 精度一般不如外部晶振（受温度影响有漂移）

### 外部时钟（HSE/LSE）

**优点**：
- 精度高
- 稳定性好
- 适合 USB、RTC、通信等精度要求较高的场景

**缺点**：
- 需要额外硬件
- 电路更复杂一点

---

# 2. STM32时钟树详解

## 2.1 时钟树图解

![STM32时钟示意图](/img/stm32/56.png)

时钟树展示了 STM32 内部各时钟信号的产生和分配路径。最常用的配置路径是：

```
HSE (8MHz) → PLL × 9 → SYSCLK (72MHz) → HCLK → PCLK1/PCLK2
```

## 2.2 关键时钟节点（SYSCLK/HCLK/PCLK）

学习 STM32 时钟时，最重要的是搞清楚几个"关键节点"：

### SYSCLK（系统时钟）

> **整个系统最核心的时钟输入**

它通常来自：
- HSI（内部高速时钟，8MHz）
- HSE（外部高速时钟）
- PLL 输出

开发里最常见的是：**HSE → PLL → SYSCLK = 72MHz**

### HCLK（AHB 总线时钟）

> **CPU / 总线相关的重要工作时钟**

连接：
- Cortex-M3 内核
- DMA
- 内存（Flash/SRAM）

### PCLK1 / PCLK2（APB 外设时钟）

STM32 把外设分到不同总线上：

| 总线 | 时钟 | 最大频率 | 常见外设 |
|------|------|---------|---------|
| **APB1** | PCLK1 | 36 MHz | USART2/3/4/5、SPI2/3、I2C1/2、TIM2/3/4/5 |
| **APB2** | PCLK2 | 72 MHz | USART1、SPI1、GPIOA~E、ADC1/2/3、TIM1 |

> **新手最常踩的坑**：外设"不工作"，本质上是没开时钟！几乎所有外设初始化的第一步都是 `RCC->APB2ENR |= xxx`。

### 特殊时钟

| 时钟 | 用途 |
|------|------|
| **RTCCLK** | RTC 实时时钟 |
| **IWDGCLK** | 独立看门狗时钟 |
| **ADCCLK** | ADC 采样时钟 |
| **USBCLK** | USB 时钟（48MHz，需 PLL 输出） |

## 2.3 PLL锁相环（倍频器）

> **PLL（Phase Locked Loop）= 把低频时钟"放大"成高频**

例如：**8MHz × 9 = 72MHz**

### 为什么需要 PLL？

外部晶振或内部时钟源频率往往有限，不能直接满足 MCU 高速运行需求。所以一般流程是：

```
时钟源 → PLL 倍频 → 系统主时钟
```

### STM32 PLL 配置

PLL 输入源可以是 HSI/2 或 HSE（可分频），倍频系数从 ×2 到 ×16 可选。

**最常用配置**：HSE 8MHz → PLL × 9 → 72MHz

## 2.4 SysTick与MCO

### SysTick

SysTick 是 Cortex-M 内核自带的一个系统定时器，非常重要：

- 毫秒延时
- 系统节拍
- RTOS 心跳
- 周期性任务调度

> 可以把它理解成**单片机内部的"系统时钟节拍器"**。

### MCO（Microcontroller Clock Output）

MCO 可以把某些时钟输出到引脚上，用于：

- 调试时钟是否正确
- 用示波器测量频率

---

# 3. RCC寄存器详解

## 3.1 RCC寄存器映射（基地址0x40021000）

RCC（Reset and Clock Control）负责：
- **Reset（复位）**
- **Clock（时钟）**

> 几乎所有外设开发的第一步，都是先通过 RCC 开时钟。

RCC 基地址：`0x4002 1000`

地址计算公式：`绝对地址 = 基地址 + 偏移地址`

| 寄存器 | 偏移 | 绝对地址 | 功能 | 重要性 |
|--------|------|----------|------|--------|
| **RCC_CR** | 0x00 | 0x40021000 | 时钟控制寄存器（HSE/HSI/PLL使能及就绪标志） | 重要 |
| **RCC_CFGR** | 0x04 | 0x40021004 | 时钟配置寄存器（系统时钟源切换、预分频配置） | 重要 |
| **RCC_CIR** | 0x08 | 0x40021008 | 时钟中断寄存器 | 一般 |
| **RCC_APB2RSTR** | 0x0C | 0x4002100C | APB2 外设复位寄存器 | 常用 |
| **RCC_APB1RSTR** | 0x10 | 0x40021010 | APB1 外设复位寄存器 | 常用 |
| **RCC_AHBENR** | 0x14 | 0x40021014 | AHB 外设时钟使能（DMA, SDIO, CRC等） | 重要 |
| **RCC_APB2ENR** | 0x18 | 0x40021018 | APB2 外设时钟使能（GPIO, ADC, TIM1等） | 重要 |
| **RCC_APB1ENR** | 0x1C | 0x4002101C | APB1 外设时钟使能（TIMx, USARTx, I2C等） | 重要 |
| **RCC_BDCR** | 0x20 | 0x40021020 | 备份域控制寄存器（RTC, LSE） | 一般 |
| **RCC_CSR** | 0x24 | 0x40021024 | 控制/状态寄存器（LSI, 复位标志） | 一般 |

## 3.2 RCC_CR（时钟控制寄存器）

**作用**：控制 HSI / HSE / PLL 的开关，判断它们是否稳定。

关键位：

| 位 | 名称 | 功能 |
|----|------|------|
| bit0 | HSION | HSI 时钟使能 |
| bit1 | HSIRDY | HSI 时钟就绪标志 |
| bit16 | HSEON | HSE 时钟使能 |
| bit17 | HSERDY | HSE 时钟就绪标志 |
| bit24 | PLLON | PLL 使能 |
| bit25 | PLLRDY | PLL 就绪标志 |

## 3.3 RCC_CFGR（时钟配置寄存器）

**作用**：选择系统时钟来源、配置 PLL、设置 AHB/APB 分频。

关键字段：

| 字段 | 位 | 功能 |
|------|-----|------|
| SW[1:0] | bit[1:0] | 系统时钟源选择（HSI/HSE/PLL） |
| SWS[1:0] | bit[3:2] | 系统时钟源状态（硬件反映实际使用哪个） |
| HPRE[3:0] | bit[7:4] | AHB 预分频（HCLK） |
| PPRE1[2:0] | bit[10:8] | APB1 预分频（PCLK1） |
| PPRE2[2:0] | bit[13:11] | APB2 预分频（PCLK2） |
| PLLSRC | bit16 | PLL 输入源选择 |
| PLLMUL[3:0] | bit18:21 | PLL 倍频系数 |

## 3.4 RCC_APB2ENR / RCC_APB1ENR（外设时钟使能）

> **开发中最常写的一类寄存器 = 给外设开时钟**

常用位：

```c
// 开启 GPIOA 时钟
RCC->APB2ENR |= (1 << 2);    // bit2 = 1

// 开启 USART1 时钟
RCC->APB2ENR |= (1 << 14);   // bit14 = 1

// 开启 TIM1 时钟
RCC->APB2ENR |= (1 << 11);   // bit11 = 1

// 开启 TIM2 时钟（APB1）
RCC->APB1ENR |= (1 << 0);    // bit0 = 1

// 开启 USART2 时钟（APB1）
RCC->APB1ENR |= (1 << 17);   // bit17 = 1
```

> **本质**：给某个外设"通电上班"。不做这一步，后面配置寄存器通常都不会生效。

## 3.5 寄存器位操作（掩码/位带）

寄存器位一般有三种类型：

### 状态位
- 反映当前硬件状态，一般"读"为主
- 例如：HSERDY（时钟是否稳定）

### 开关位
- 控制模块开/关，一般写 0/1
- 例如：HSEON（时钟使能）

### 设置值位
- 用来配置参数，通常不止 1 位
- 例如：分频系数、PLL 倍频数

### 掩码操作三法则

```c
// ① 置位（set）：把某些位强制设为 1
REG |= MASK;

// ② 清零（reset）：把某些位强制设为 0
REG &= ~MASK;

// ③ 先清后写（read-modify-write）：修改某个字段为特定值
REG = (REG & ~FIELD_MASK) | (VALUE << FIELD_POS);
```

---

# 4. 标准库函数解析

## 4.1 RCC_DeInit() - 复位RCC

**功能**：将 RCC 所有相关寄存器恢复到复位（上电）默认状态。

**使用场景**：重新初始化时钟系统之前的"清场"操作。

```c
void RCC_DeInit(void)
{
    /* 步骤1：开启 HSI（内部 8MHz RC 振荡器） */
    RCC->CR |= (uint32_t)0x00000001;   // HSION = 1

    /* 步骤2：CFGR 清零（系统时钟切回 HSI，所有分频器归默认） */
    RCC->CFGR = (uint32_t)0x00000000;

    /* 步骤3：关闭 HSEON、CSSON、PLLON */
    RCC->CR &= (uint32_t)0xFEF6FFFF;

    /* 步骤4：清除 PLLSRC / PLLXTPRE / PLLMUL */
    RCC->CFGR &= (uint32_t)0xFF80FFFF;

    /* 步骤5：关闭 HSE 旁路 */
    RCC->CR &= (uint32_t)0xFFFBFFFF;

    /* 步骤6：清除所有时钟中断 */
    RCC->CIR = 0x009F0000;
}
```

**执行后状态**：

| 项目 | 状态 |
|------|------|
| 系统时钟源 | HSI（8 MHz） |
| AHB/APB 分频 | 不分频（×1） |
| HSE | 关闭 |
| PLL | 关闭 |
| CSS | 关闭 |

## 4.2 RCC_HSEConfig() - 配置HSE

**功能**：配置外部高速时钟（HSE）的工作模式。

**参数取值**：

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_HSE_OFF` | 0x00000000 | 关闭 HSE |
| `RCC_HSE_ON` | 0x00010000 | 开启 HSE（使用外部晶振） |
| `RCC_HSE_Bypass` | 0x00040000 | 旁路模式（使用外部时钟信号，非晶振） |

**核心逻辑**：

```c
void RCC_HSEConfig(uint32_t RCC_HSE)
{
    /* 必须先把 HSEON 和 HSEBYP 都清零，再写入新值 */
    RCC->CR &= CR_HSEON_Reset;    // 清除 HSEON
    RCC->CR &= CR_HSEBYP_Reset;  // 清除 HSEBYP

    switch(RCC_HSE)
    {
        case RCC_HSE_ON:
            RCC->CR |= CR_HSEON_Set;
            break;
        case RCC_HSE_Bypass:
            RCC->CR |= CR_HSEBYP_Set | CR_HSEON_Set;
            break;
        default:  // RCC_HSE_OFF
            break;
    }
}
```

**注意事项**：
- HSE 被用作系统时钟时不能被关闭
- 切换 ON ↔ Bypass 必须经过 OFF

## 4.3 RCC_WaitForHSEStartUp() - 等待HSE稳定

**功能**：等待 HSE 振荡器稳定，带超时机制防止死等。

```c
ErrorStatus RCC_WaitForHSEStartUp(void)
{
    __IO uint32_t StartUpCounter = 0;
    ErrorStatus status = ERROR;
    FlagStatus HSEStatus = RESET;

    do {
        HSEStatus = RCC_GetFlagStatus(RCC_FLAG_HSERDY);
        StartUpCounter++;
    } while ((StartUpCounter != HSE_STARTUP_TIMEOUT) && (HSEStatus == RESET));

    if (RCC_GetFlagStatus(RCC_FLAG_HSERDY) != RESET)
        status = SUCCESS;
    else
        status = ERROR;

    return status;
}
```

**典型使用模式**：

```c
RCC_HSEConfig(RCC_HSE_ON);                 // ① 打开 HSE
if (RCC_WaitForHSEStartUp() == SUCCESS)    // ② 等待并判断
{
    // ③ HSE 稳定，继续配置 PLL
}
else
{
    // HSE 启动失败，错误处理
}
```

## 4.4 RCC_HSICmd() - 控制HSI

**功能**：使能或禁止 HSI（内部 8MHz 振荡器）。

```c
void RCC_HSICmd(FunctionalState NewState)
{
    // 操作 RCC_CR 的 HSION 位（bit0）
    *((__IO uint32_t *) CR_HSION_BB) = (uint32_t)NewState;
    // 注意：这里用的是位带（Bit-Band）访问！
}
```

**注意事项**：
- HSI 正在作为系统时钟时不能被关闭
- 系统复位后，HSI 默认开启

## 4.5 RCC_PLLConfig() - 配置PLL

**功能**：配置 PLL 的时钟源和倍频系数（但不启动 PLL）。

**参数 RCC_PLLSource（PLL 输入源）**：

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_PLLSource_HSI_Div2` | 0x00000000 | HSI / 2 = 4 MHz |
| `RCC_PLLSource_HSE_Div1` | 0x00010000 | HSE（不分频） |
| `RCC_PLLSource_HSE_Div2` | 0x00030000 | HSE / 2 |

**参数 RCC_PLLMul（倍频系数）**：

| 宏定义 | 实际倍数 |
|--------|---------|
| `RCC_PLLMul_2` | ×2 |
| `RCC_PLLMul_9` | ×9（最常用：8MHz × 9 = 72MHz） |
| `RCC_PLLMul_16` | ×16（最大） |

**核心逻辑**：

```c
void RCC_PLLConfig(uint32_t RCC_PLLSource, uint32_t RCC_PLLMul)
{
    uint32_t tmpreg = RCC->CFGR;
    /* 清除 PLLSRC / PLLXTPRE / PLLMUL 字段 */
    tmpreg &= CFGR_PLL_Mask;
    /* 写入新值 */
    tmpreg |= RCC_PLLSource | RCC_PLLMul;
    RCC->CFGR = tmpreg;
}
```

> **重要**：PLL 运行时不能修改配置！必须先关闭 PLL，修改完再重新开启。

## 4.6 RCC_SYSCLKConfig() - 切换系统时钟

**功能**：选择系统时钟（SYSCLK）的来源。

**参数取值**：

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_SYSCLKSource_HSI` | 0x00000000 | HSI 作为系统时钟 |
| `RCC_SYSCLKSource_HSE` | 0x00000001 | HSE 作为系统时钟 |
| `RCC_SYSCLKSource_PLLCLK` | 0x00000002 | PLL 输出作为系统时钟 |

**核心逻辑**：

```c
void RCC_SYSCLKConfig(uint32_t RCC_SYSCLKSource)
{
    uint32_t tmpreg = RCC->CFGR;
    /* 清除 SW[1:0]（bit1:0） */
    tmpreg &= CFGR_SW_Mask;  // = 0xFFFFFFFC
    /* 写入新时钟源 */
    tmpreg |= RCC_SYSCLKSource;
    RCC->CFGR = tmpreg;
}
```

**切换后验证**（读取 SWS[1:0]）：

```c
// 等待系统时钟切换到 PLL
while (RCC_GetSYSCLKSource() != 0x08);
// 0x08 = SWS[1:0] = 10（PLL 已成为系统时钟）
```

| SWS 值 | 实际系统时钟 |
|--------|------------|
| 0x00 | HSI |
| 0x04 | HSE |
| 0x08 | PLL |

---

# 5. 72MHz系统时钟配置实战

## 5.1 硬件需求

- STM32F103 系列芯片
- 外部高速晶振（HSE）8 MHz
- 期望系统主频：72 MHz

## 5.2 完整配置流程

```c
void SystemClock_72MHz(void)
{
    /* 1. 开启 HSE */
    RCC_HSEConfig(RCC_HSE_ON);

    /* 2. 等待 HSE 稳定 */
    if (RCC_WaitForHSEStartUp() != SUCCESS) {
        // HSE 失败，错误处理
        return;
    }

    /* 3. 配置 Flash 等待周期（72MHz 必须设为 2 个等待周期） */
    FLASH_SetLatency(FLASH_Latency_2);
    FLASH_PrefetchBufferCmd(FLASH_PrefetchBuffer_Enable);

    /* 4. 配置总线分频器 */
    RCC_HCLKConfig(RCC_SYSCLK_Div1);    // AHB  = SYSCLK / 1 = 72MHz
    RCC_PCLK2Config(RCC_HCLK_Div1);    // APB2 = HCLK  / 1 = 72MHz
    RCC_PCLK1Config(RCC_HCLK_Div2);    // APB1 = HCLK  / 2 = 36MHz（最大36MHz）

    /* 5. 配置 PLL：HSE × 9 = 72MHz */
    RCC_PLLConfig(RCC_PLLSource_HSE_Div1, RCC_PLLMul_9);

    /* 6. 开启 PLL */
    RCC_PLLCmd(ENABLE);

    /* 7. 等待 PLL 稳定 */
    while (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) == RESET);

    /* 8. 切换系统时钟到 PLL */
    RCC_SYSCLKConfig(RCC_SYSCLKSource_PLLCLK);

    /* 9. 等待切换完成 */
    while (RCC_GetSYSCLKSource() != 0x08);

    // 系统时钟现在是 72MHz
}
```

**时钟配置图解**：

```
HSE (8MHz)
    │
    └──→ PLL × 9 ──→ SYSCLK (72MHz) ──→ HCLK (72MHz) ──→ CPU / DMA / SRAM
                              │
                              ├──→ APB2 (72MHz) ──→ GPIO, ADC, USART1, TIM1
                              │
                              └──→ APB1 (36MHz) ──→ USART2/3, SPI2, I2C, TIM2/3/4
```

## 5.3 验证方法

### 方法一：检查时钟切换标志

```c
// 验证系统时钟源
uint32_t sysclk_source = RCC_GetSYSCLKSource();
if (sysclk_source == 0x08) {
    // 当前是 PLL 时钟
}

// 验证 PLL 就绪标志
if (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) != RESET) {
    // PLL 已就绪
}
```

### 方法二：MCO 输出测量

使用 MCO 引脚（通常为 PA8）输出时钟，用示波器测量频率验证。

---

# 6. 寄存器位操作进阶

## 6.1 位带（Bit-Band）访问机制

### 什么是位带？

Cortex-M3 提供了一种**把寄存器的每一个 bit 映射到一个独立的 32-bit 地址**的机制：

- **普通写法**：读-改-写，3 步，存在被中断打断的风险
- **位带写法**：直接对单个 bit 的地址写 0 或 1，原子操作，1 步完成

### 两个位带区域

| 区域 | 原始地址范围 | 位带别名地址范围 |
|------|------------|----------------|
| SRAM | 0x2000_0000 ~ 0x200F_FFFF（1MB） | 0x2200_0000 ~ 0x23FF_FFFF（32MB） |
| 外设 | 0x4000_0000 ~ 0x400F_FFFF（1MB） | 0x4200_0000 ~ 0x43FF_FFFF（32MB） |

### 别名地址计算公式

```
别名地址 = 基地址 + (字节偏移 × 32) + (位号 × 4)
```

**示例**：操作 RCC_CR 寄存器（地址 0x4002_1000）的第 0 位（HSION）：

```
字节偏移 = 0x40021000 - 0x40000000 = 0x21000
别名地址 = 0x42000000 + (0x21000 × 32) + (0 × 4)
         = 0x42000000 + 0x420000 + 0
         = 0x42420000
```

直接对 0x42420000 写 1 → HSION 置 1（打开 HSI）

## 6.2 断言机制 assert_param

`assert_param(expr)` 是 STM32 标准库中的**参数合法性检查**机制：

```c
/* 使能断言时（调试版本）*/
#define assert_param(expr)  ((expr) ? (void)0 : assert_failed((uint8_t *)__FILE__, __LINE__))

/* 关闭断言时（发布版本，节省代码空间）*/
#define assert_param(expr)  ((void)0)
```

**用户需要自己实现 assert_failed()**：

```c
void assert_failed(uint8_t* file, uint32_t line)
{
    /* 方式一：死循环，配合调试器 */
    while (1) { }

    /* 方式二：串口打印（推荐调试阶段使用）*/
    printf("Assert failed: file %s on line %d\r\n", file, line);
    while (1) { }
}
```

> **学习要点**：看到 `IS_RCC_XXX(param)` 这类宏，去头文件里找定义，就知道该函数接受哪些合法参数值。

---

# 7. 常见问题与调试

### Q1：外设不工作？

**检查清单**：
1. 是否已开启该外设的时钟？`RCC->APB2ENR` 或 `RCC->APB1ENR`
2. 时钟源是否正确配置？
3. 相关引脚是否已正确复用？

### Q2：系统时钟配置后死机？

**常见原因**：
- HSE 起振失败（晶振损坏或配置错误）
- PLL 配置超过最大频率
- Flash 等待周期未正确设置

**排查方法**：
1. 检查 HSE 晶振焊接是否良好
2. 用 MCO 测量时钟输出
3. 调试器暂停查看 PC 指针位置

### Q3：如何回退到 HSI？

```c
RCC_HSEConfig(RCC_HSE_OFF);
RCC_SYSCLKConfig(RCC_SYSCLKSource_HSI);
while (RCC_GetSYSCLKSource() != 0x00);  // 等待切换到 HSI
```

### Q4：PLL 配置何时修改？

> **PLL 运行时不能修改配置！**

正确流程：
```c
RCC_PLLCmd(DISABLE);      // 先关闭
RCC_PLLConfig(...);       // 再修改
RCC_PLLCmd(ENABLE);       // 最后开启
```

---

## 快速函数参考卡

| 函数 | 核心操作 | 关键注意点 |
|------|---------|-----------|
| `RCC_DeInit()` | 所有时钟寄存器回到复位值 | 会切回 HSI，谨慎使用 |
| `RCC_HSEConfig()` | 设置 HSE 的 ON/OFF/Bypass | 切换必须经过 OFF |
| `RCC_WaitForHSEStartUp()` | 轮询 HSERDY，带超时 | 返回 SUCCESS/ERROR |
| `RCC_HSICmd()` | 控制 HSION 位（用位带） | 作系统时钟时不能关 |
| `RCC_PLLConfig()` | 写 PLLSRC + PLLMUL | PLL 运行时不能配置 |
| `RCC_SYSCLKConfig()` | 写 SW[1:0] 切换时钟源 | 写后读 SWS 验证切换 |

---

> **核心记忆**：
> - STM32 不是"一个时钟"，而是"一棵时钟树"
> - 几乎所有外设开发的第一步，都是先通过 RCC 开时钟
> - 时钟就是单片机的心脏
