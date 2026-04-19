---
title: 定时器基础
---

# 定时器基础

本文系统讲解 STM32 定时器的分类、时基单元、计数模式、PWM 配置及编码器接口。

---

## 一、定时器概述

### 1.1 什么是定时器

**定时器（Timer）**是 MCU 中用于精确计时的外设。它能：

- 产生精确的时间基准
- 测量输入信号频率/脉宽
- 生成 PWM 信号控制负载
- 触发 DMA 传输
- 触发 ADC 采样

### 1.2 STM32 定时器家族

STM32F103 系列定时器分为三类：

| 类型 | 定时器 | 特点 | 适用场景 |
|------|--------|------|----------|
| **基本定时器** | TIM6、TIM7 | 16位，只能定时 | 简单定时、DAC触发 |
| **通用定时器** | TIM2/3/4/5 | 16位，定时/捕获/比较/PWM | 编码器、PWM输入输出 |
| **高级定时器** | TIM1、TIM8 | 16位，死区、刹车、互补输出 | 电机控制、三相PWM |

---

## 二、定时器分类详解

### 2.1 基本定时器（TIM6/TIM7）

**特性**：
- 16 位自动重装载计数器
- 只能向上计数
- 无外部触发输入
- 可触发 DAC

**结构框图**：
```
    ┌─────────────┐
    │ 时钟 (CK_PSC)│
    └──────┬──────┘
           ↓
    ┌─────────────┐
    │  预分频器   │ PSC
    │  (1~65536)  │
    └──────┬──────┘
           ↓
    ┌─────────────┐
    │   计数器    │ CNT (向上计数)
    │   (0~ARR)  │
    └──────┬──────┘
           ↓
    ┌─────────────┐
    │ 自动重装载  │ ARR
    │  (0~65535)  │
    └──────┬──────┘
           ↓
        更新事件
           ↓
    ┌─────────────┐
    │  DMA/中断   │
    └─────────────┘
```

**代码示例**：
```c
#include "stm32f10x.h"

void TIM6_Init(void) {
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    
    // 使能TIM6时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM6, ENABLE);
    
    // 配置时基单元
    TIM_TimeBaseStructure.TIM_Prescaler = 7200 - 1;    // 72MHz / 7200 = 10kHz
    TIM_TimeBaseStructure.TIM_Period = 10000 - 1;      // 10kHz / 10000 = 1Hz
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM6, &TIM_TimeBaseStructure);
    
    // 使能更新中断
    TIM_ITConfig(TIM6, TIM_IT_Update, ENABLE);
    
    // 使能定时器
    TIM_Cmd(TIM6, ENABLE);
}

void TIM6_IRQHandler(void) {
    if (TIM_GetITStatus(TIM6, TIM_IT_Update) != RESET) {
        // 定时1秒到达
        TIM_ClearITPendingBit(TIM6, TIM_IT_Update);
    }
}
```

### 2.2 通用定时器（TIM2/3/4/5）

**特性**：
- 16 位计数器（向上/向下/中心对齐）
- 4 个独立通道（输入捕获/输出比较/PWM）
- 支持正交编码器接口
- 支持外部触发同步

**通用定时器结构**：
```
                      ┌──────────────────────────────────┐
                      │           时钟输入                │
                      │  (内部时钟 / ETR / CH1 / CH2)     │
                      └──────────────┬───────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │        预分频器 (PSC)        │
                    │      CK_PSC = CK_CNT / PSC   │
                    └──────────────┬──────────────┘
                                   ↓
                    ┌──────────────┬──────────────┐
                    │          计数器 (CNT)         │
                    │  向上/向下/中心对齐计数       │
                    └──────────────┬──────────────┘
                                   ↓
                    ┌──────────────┬──────────────┐
                    │      自动重装载 (ARR)        │
                    │   CNT 溢出时产生更新事件      │
                    └──────────────────────────────┘

            ┌──────────────┐          ┌──────────────┐
            │  捕获/比较1  │          │  捕获/比较2  │
            │   (CH1/CCR1) │          │   (CH2/CCR2) │
            └──────────────┘          └──────────────┘
            ┌──────────────┐          ┌──────────────┐
            │  捕获/比较3  │          │  捕获/比较4  │
            │   (CH3/CCR3) │          │   (CH4/CCR4) │
            └──────────────┘          └──────────────┘
```

### 2.3 高级定时器（TIM1/TIM8）

**特性**：
- 16 位计数器
- 多达 4 个输入捕获/输出比较通道
- 死区插入和互补输出
- 刹车输入（用于电机安全制动）
- 支持马达控制算法

---

## 三、时基单元详解

### 3.1 时基单元组成

定时器的**时基单元（Time Base Unit）**包含：

| 寄存器 | 说明 | 作用 |
|--------|------|------|
| **PSC** | 预分频器 | 决定计数时钟频率 |
| **ARR** | 自动重装载寄存器 | 计数器溢出值 |
| **CNT** | 计数器 | 当前计数值 |
| **RCR** | 重复计数器 | 高级定时器独有 |

### 3.2 时钟源

通用定时器时钟源选择：

```c
// 方式1：使用内部时钟 (APB1/APB2)
TIM_InternalClockConfig(TIM2);

// 方式2：使用外部时钟模式1 (ETR)
TIM_ETRClockMode1Config(TIM2, TIM_ExtTRGPSC_DIV4, TIM_ExtTRGPolarity_NonInverted, 0);

// 方式3：使用外部时钟模式2 (ETR)
TIM_ETRClockMode2Config(TIM2, TIM_ExtTRGPSC_DIV4, TIM_ExtTRGPolarity_NonInverted, 0);

// 方式4：使用触发输入作为时钟
TIM_ITRxExternalClockConfig(TIM2, TIM_TS_ITRx);
```

### 3.3 预分频器（PSC）

PSC 将输入时钟分频后提供给计数器：

```
CK_CNT = CK_PSC / (PSC + 1)
```

**示例**：
```c
// 72MHz 系统时钟
// PSC = 7200 - 1 → CK_CNT = 72MHz / 7200 = 10kHz
// ARR = 10000 - 1 → 每 1 秒产生一次更新中断

TIM_TimeBaseStructure.TIM_Prescaler = 7200 - 1;
TIM_TimeBaseStructure.TIM_Period = 10000 - 1;
```

### 3.4 计数器（CNT）

CNT 是定时器的核心，根据计数模式进行递增或递减。

**溢出周期计算**：
```
T = (ARR + 1) × (PSC + 1) / F_TIMER
```

| 参数 | 含义 |
|------|------|
| T | 溢出周期 |
| ARR | 自动重装载值 |
| PSC | 预分频值 |
| F_TIMER | 定时器输入时钟频率 |

**示例**：
```c
// 计算 1ms 定时
// 假设 APB1 时钟 = 72MHz (实际 = 36MHz × 2)
// F_TIMER = 72MHz, T = 1ms = 0.001s
// (ARR + 1) × (PSC + 1) = 72000
// 选择 PSC = 71, ARR = 999 (即 72 × 1000)

TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1;     // 72MHz / 72 = 1MHz
TIM_TimeBaseStructure.TIM_Period = 1000 - 1;     // 1MHz / 1000 = 1kHz = 1ms
```

---

## 四、计数模式

### 4.1 向上计数（Up Count）

计数器从 0 开始，递增到 ARR 值，然后复位为 0 并产生更新事件。

```
CNT: 0 → 1 → 2 → ... → ARR-1 → ARR → 0 → 1 → ...
                    ↑                  ↑
              产生更新事件         产生更新事件
```

**配置**：
```c
TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
```

### 4.2 向下计数（Down Count）

计数器从 ARR 值开始，递减到 0，然后复位为 ARR 并产生更新事件。

```
CNT: ARR → ARR-1 → ... → 1 → 0 → ARR → ARR-1 → ...
           ↑                  ↑
     产生更新事件         产生更新事件
```

**配置**：
```c
TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Down;
```

### 4.3 中心对齐模式（Center-Aligned）

计数器在 0 和 ARR 之间来回计数。分为三种模式：

| 模式 | 说明 |
|------|------|
| 模式1 | 向上计数时产生更新，递减时不清零 |
| 模式2 | 向下计数时产生更新，递增时不清零 |
| 模式3 | 向上和向下计数时都产生更新 |

**特点**：
- PWM 频率为中心对齐模式的两倍
- 适合电机控制

**配置**：
```c
TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_CenterAligned1;
// 或 TIM_CounterMode_CenterAligned2
// 或 TIM_CounterMode_CenterAligned3
```

---

## 五、PWM 输出模式

### 5.1 PWM 基本原理

**PWM（Pulse Width Modulation）**是通过调节脉冲宽度来控制输出功率的技术。

```
占空比 = (脉冲宽度) / (周期) × 100%
```

**示例**：
```
周期 = 1ms，占空比 = 50%
高电平时间 = 0.5ms，低电平时间 = 0.5ms
```

### 5.2 PWM 模式

定时器支持两种 PWM 模式：

| 模式 | 说明 |
|------|------|
| **PWM模式1** | CNT < CCR 时输出有效电平 |
| **PWM模式2** | CNT > CCR 时输出有效电平 |

### 5.3 PWM 输出配置步骤

```c
#include "stm32f10x.h"

void TIM1_PWM_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;
    
    // 1. 使能GPIO和TIM1时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_TIM1, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    // 2. 配置PA8为复用推挽输出（TIM1_CH1）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_8;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 3. 配置时基单元
    TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1;       // 1MHz
    TIM_TimeBaseStructure.TIM_Period = 1000 - 1;        // 1kHz (1ms周期)
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM1, &TIM_TimeBaseStructure);
    
    // 4. 配置PWM输出
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;     // 模式1
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 500 - 1;            // 初始占空比 50%
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM1, &TIM_OCInitStructure);             // CH1
    
    // 5. 使能TIM1（主输出使能 - 高级定时器需要）
    TIM_CtrlPWMOutputs(TIM1, ENABLE);
    
    // 6. 使能定时器
    TIM_Cmd(TIM1, ENABLE);
}

// 动态修改占空比
void TIM1_SetDutyCycle(uint16_t duty) {
    TIM1->CCR1 = duty;  // 直接操作寄存器
}
```

### 5.4 多通道 PWM 输出

```c
void TIM3_PWM_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;
    
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC, ENABLE);
    
    // 配置PC6/PC7/PC8/PC9为复用推挽输出（TIM3_CH1/2/3/4）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7 | GPIO_Pin_8 | GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOC, &GPIO_InitStructure);
    
    // 时基配置
    TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1;       // 1MHz
    TIM_TimeBaseStructure.TIM_Period = 1000 - 1;       // 1kHz
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM3, &TIM_TimeBaseStructure);
    
    // CH1 PWM配置
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 250 - 1;           // 25% 占空比
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM3, &TIM_OCInitStructure);
    TIM_OC1PreloadConfig(TIM3, TIM_OCPreload_Enable);
    
    // CH2 PWM配置
    TIM_OCInitStructure.TIM_Pulse = 500 - 1;           // 50% 占空比
    TIM_OC2Init(TIM3, &TIM_OCInitStructure);
    TIM_OC2PreloadConfig(TIM3, TIM_OCPreload_Enable);
    
    // CH3 PWM配置
    TIM_OCInitStructure.TIM_Pulse = 750 - 1;           // 75% 占空比
    TIM_OC3Init(TIM3, &TIM_OCInitStructure);
    TIM_OC3PreloadConfig(TIM3, TIM_OCPreload_Enable);
    
    // CH4 PWM配置
    TIM_OCInitStructure.TIM_Pulse = 1000 - 1;          // 100% 占空比
    TIM_OC4Init(TIM3, &TIM_OCInitStructure);
    TIM_OC4PreloadConfig(TIM3, TIM_OCPreload_Enable);
    
    // 使能自动重装载预装载
    TIM_ARRPreloadConfig(TIM3, ENABLE);
    
    TIM_Cmd(TIM3, ENABLE);
}
```

### 5.5 PWM 频率和分辨率计算

```
PWM频率 = F_TIMER / ARR
PWM分辨率 = 1 / (ARR + 1) × 100%
```

| ARR | 频率 @ 1MHz | 分辨率 |
|-----|------------|--------|
| 100 | 10kHz | 1% |
| 1000 | 1kHz | 0.1% |
| 10000 | 100Hz | 0.01% |

---

## 六、PWM 输入模式

### 6.1 PWM 输入模式原理

PWM 输入模式用于**测量输入信号的频率和占空比**。

**配置要求**：
- 需要两个通道（CH1 和 CH2）
- 一个通道配置为输入捕获（上升沿）
- 另一个通道配置为输入捕获（下降沿）

**原理**：
```
TI1 (上升沿) → CNT reset → CCR1 = 周期
TI2 (下降沿) → CCR2 = 脉宽
频率 = 1 / CCR1
占空比 = CCR2 / CCR1 × 100%
```

### 6.2 PWM 输入配置

```c
void TIM2_PWM_Input_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_ICInitTypeDef TIM_ICInitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;
    
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    // 配置PA0为浮空输入（TIM2_CH1）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // TIM2 PWM输入配置
    TIM_ICInitStructure.TIM_Channel = TIM_Channel_1;
    TIM_ICInitStructure.TIM_ICPolarity = TIM_ICPolarity_Rising;
    TIM_ICInitStructure.TIM_ICSelection = TIM_ICSelection_DirectTI;
    TIM_ICInitStructure.TIM_ICPrescaler = TIM_ICPSC_DIV1;
    TIM_ICInitStructure.TIM_ICFilter = 0x0F;
    TIM_PWMIConfig(TIM2, &TIM_ICInitStructure);
    
    // 配置CH2为间接输入（反向极性）
    TIM_ICInitStructure.TIM_Channel = TIM_Channel_2;
    TIM_ICInitStructure.TIM_ICPolarity = TIM_ICPolarity_Falling;
    TIM_ICInitStructure.TIM_ICSelection = TIM_ICSelection_IndirectTI;
    TIM_PWMIConfig(TIM2, &TIM_ICInitStructure);
    
    // 选择内部时钟
    TIM_SelectInputTrigger(TIM2, TIM_TS_TI1FP1);
    TIM_SelectSlaveMode(TIM2, TIM_SlaveMode_Reset);
    
    // 使能中断
    TIM_ITConfig(TIM2, TIM_IT_CC1, ENABLE);
    
    // NVIC配置
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
    
    TIM_Cmd(TIM2, ENABLE);
}

volatile uint32_t pwm_period = 0;
volatile uint32_t pwm_duty = 0;

void TIM2_IRQHandler(void) {
    if (TIM_GetITStatus(TIM2, TIM_IT_CC1) != RESET) {
        // 获取周期（CCR1）
        pwm_period = TIM_GetCapture1(TIM2);
        
        // 获取脉宽（CCR2）
        pwm_duty = TIM_GetCapture2(TIM2);
        
        TIM_ClearITPendingBit(TIM2, TIM_IT_CC1);
    }
}
```

---

## 七、编码器模式

### 7.1 正交编码器原理

正交编码器输出两路相位差 90° 的脉冲信号：

```
A相 ───┐     ┌───
       │     │
       └───┘ └───
B相 ──┐ ┌─────┐ ┌─
      │ │     │ │
      └─┘     └─┘

       ↑ 计数方向取决于 A领先还是B领先
```

**旋转方向判断**：
- A 相领先 B 相 90°：正向计数
- B 相领先 A 相 90°：反向计数

### 7.2 编码器接口配置

```c
void TIM2_Encoder_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_ICInitTypeDef TIM_ICInitStructure;
    
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    // 配置PA0/PA1为浮空输入（编码器A/B相）
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 编码器接口配置
    TIM_ICInitStructure.TIM_Channel = TIM_Channel_1;
    TIM_ICInitStructure.TIM_ICPolarity = TIM_ICPolarity_Rising;
    TIM_ICInitStructure.TIM_ICSelection = TIM_ICSelection_TRC;
    TIM_ICInitStructure.TIM_ICPrescaler = TIM_ICPSC_DIV1;
    TIM_ICInitStructure.TIM_ICFilter = 0x06;  // 滤波
    TIM_ICInit(TIM2, &TIM_ICInitStructure);
    
    TIM_ICInitStructure.TIM_Channel = TIM_Channel_2;
    TIM_ICICConfig(TIM2, &TIM_ICInitStructure);
    
    // 配置时基（ARR设置计数上限）
    TIM_TimeBaseStructure.TIM_Prescaler = 0;       // 不分频
    TIM_TimeBaseStructure.TIM_Period = 0xFFFF;    // 最大计数值
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseStructure);
    
    // 配置编码器模式
    // 模式3：CH1和CH2边沿都计数
    TIM_EncoderInterfaceConfig(TIM2, TIM_EncoderMode_TI1, TIM_ICPolarity_Rising, TIM_ICPolarity_Rising);
    
    // 使能定时器
    TIM_Cmd(TIM2, ENABLE);
}

// 读取编码器值
int16_t Encoder_Read(void) {
    return (int16_t)TIM2->CNT;  // 读取并清零计数器
}
```

### 7.3 编码器计数方向

```c
// 配置不同模式
TIM_EncoderInterfaceConfig(TIM2, TIM_EncoderMode_TI1, TIM_ICPolarity_Rising, TIM_ICPolarity_Rising);
// TIM_EncoderMode_TI1: 只计数CH1边沿
// TIM_EncoderMode_TI2: 只计数CH2边沿
// TIM_EncoderMode_TI3: 计数CH1和CH2边沿
```

---

## 八、定时器寄存器详解

### 8.1 寄存器一览

| 寄存器 | 说明 | 访问 |
|--------|------|------|
| TIMx_CR1 | 控制寄存器1 | 读写 |
| TIMx_CR2 | 控制寄存器2 | 读写 |
| TIMx_SMCR | 从模式控制寄存器 | 读写 |
| TIMx_DIER | DMA/中断使能寄存器 | 读写 |
| TIMx_SR | 状态寄存器 | 只读 |
| TIMx_EGR | 事件生成寄存器 | 只写 |
| TIMx_CCMR1 | 捕获/比较模式寄存器1 | 读写 |
| TIMx_CCMR2 | 捕获/比较模式寄存器2 | 读写 |
| TIMx_CCER | 捕获/比较使能寄存器 | 读写 |
| TIMx_CNT | 计数器 | 读写 |
| TIMx_PSC | 预分频器 | 读写 |
| TIMx_ARR | 自动重装载寄存器 | 读写 |
| TIMx_RCR | 重复计数器（高级定时器） | 读写 |
| TIMx_CCR1-4 | 捕获/比较寄存器 | 读写 |

### 8.2 控制寄存器1（TIMx_CR1）

| 位 | 说明 |
|----|------|
| DITHEN | 使能 dithering（仅高级定时器） |
| CKD[1:0] | 时钟分频 |
| ARPE | 自动重装载预装载使能 |
| CMS[1:0] | 中心对齐模式选择 |
| DIR | 计数方向（0=向上，1=向下） |
| OPM | 单脉冲模式 |
| URS | 更新请求源 |
| UDIS | 更新禁止 |
| CEN | 使能计数器 |

### 8.3 DMA/中断使能寄存器（TIMx_DIER）

| 位 | 对应中断 |
|----|----------|
| UIE | 更新中断 |
| CC1IE | 捕获/比较1中断 |
| CC2IE | 捕获/比较2中断 |
| CC3IE | 捕获/比较3中断 |
| CC4IE | 捕获/比较4中断 |
| TIE | 触发中断 |
| UI | 更新中断标志（需软件清除） |

### 8.4 捕获/比较模式寄存器（TIMx_CCMR1/2）

**输出模式**：
| 位 | 功能 |
|----|------|
| OC1CE | 输出比较1清除使能 |
| OC1M[2:0] | 输出比较1模式 |
| OC1PE | 输出比较1预装载使能 |
| OC1FE | 输出比较1快速使能 |
| CC1S[1:0] | 捕获/比较1选择 |

**输入模式**：
| 位 | 功能 |
|----|------|
| IC1PSC[1:0] | 输入捕获1预分频 |
| IC1F[3:0] | 输入捕获1滤波 |

### 8.5 直接寄存器操作示例

```c
// 使用寄存器直接配置 TIM2 为 1kHz PWM
void TIM2_PWM_Register_Init(void) {
    // 使能TIM2时钟
    RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;
    
    // 配置GPIO（PA0）
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;
    GPIOA->CRL &= ~0x0F;
    GPIOA->CRL |= 0x0B;  // AF PP, 50MHz
    
    // 配置时基
    TIM2->PSC = 72 - 1;       // 1MHz
    TIM2->ARR = 1000 - 1;     // 1kHz
    TIM2->CCR1 = 500;         // 50% 占空比
    
    // 配置输出模式
    TIM2->CCMR1 &= ~0x0070;
    TIM2->CCMR1 |= 0x0060;    // PWM模式1
    TIM2->CCMR1 |= 0x0080;    // 预装载使能
    
    // 使能输出
    TIM2->CCER |= 0x0001;     // 使能CH1
    
    // 启动
    TIM2->CR1 |= 0x0001;      // CEN
}

// 调整占空比
void TIM2_SetDuty(uint16_t duty) {
    TIM2->CCR1 = duty;
}

// 调整频率
void TIM2_SetFrequency(uint16_t arr) {
    TIM2->ARR = arr;
}
```

---

## 九、常用定时器配置示例

### 9.1 精确微秒延时

```c
void delay_us(uint16_t us) {
    RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;
    TIM2->PSC = 72 - 1;       // 1MHz = 1us per tick
    TIM2->ARR = us;
    TIM2->CNT = 0;
    TIM2->CR1 |= 0x0001;     // CEN
    
    while (!(TIM2->SR & 0x0001));  // 等待更新
    
    TIM2->SR &= ~0x0001;     // 清除标志
    TIM2->CR1 &= ~0x0001;   // 停止
}
```

### 9.2 毫秒延时（使用SysTick）

```c
void delay_ms(uint32_t ms) {
    SysTick->LOAD = 72000 - 1;  // 72MHz / 1000 = 72000
    SysTick->VAL = 0;
    SysTick->CTRL = 0x00000005; // 时钟源HCLK，使能
    
    for (uint32_t i = 0; i < ms; i++) {
        while (!(SysTick->CTRL & 0x00010000));  // COUNTFLAG
    }
    
    SysTick->CTRL = 0;
}
```

### 9.3 输入捕获测频率

```c
volatile uint32_t capture_period = 0;
volatile uint32_t capture_high = 0;
volatile uint8_t capture_done = 0;

void TIM3_IC_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_ICInitTypeDef TIM_ICInitStructure;
    
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC, ENABLE);
    
    // PC6 = TIM3_CH1
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOC, &GPIO_InitStructure);
    
    // 上升沿捕获
    TIM_ICInitStructure.TIM_Channel = TIM_Channel_1;
    TIM_ICInitStructure.TIM_ICPolarity = TIM_ICPolarity_Rising;
    TIM_ICInitStructure.TIM_ICSelection = TIM_ICSelection_DirectTI;
    TIM_ICInitStructure.TIM_ICPrescaler = TIM_ICPSC_DIV1;
    TIM_ICInitStructure.TIM_ICFilter = 0;
    TIM_ICInit(TIM3, &TIM_ICInitStructure);
    
    // 使能中断
    TIM_ITConfig(TIM3, TIM_IT_CC1, ENABLE);
    TIM_Cmd(TIM3, ENABLE);
}

void TIM3_IRQHandler(void) {
    static uint32_t last_capture = 0;
    uint32_t current_capture;
    
    if (TIM_GetITStatus(TIM3, TIM_IT_CC1) != RESET) {
        current_capture = TIM_GetCapture1(TIM3);
        
        if (last_capture != 0) {
            capture_period = current_capture - last_capture;
        }
        
        last_capture = current_capture;
        TIM_ClearITPendingBit(TIM3, TIM_IT_CC1);
    }
}
```

### 9.4 定时器同步（主从模式）

```c
void Timer_Sync_Init(void) {
    // TIM2 为主，TIM3 为从
    // TIM2 溢出触发 TIM3
    
    // TIM2 配置：1kHz
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    TIM2->PSC = 7200 - 1;
    TIM2->ARR = 10000 - 1;
    TIM2->CR1 |= 0x0001;
    
    // TIM3 配置：接收 TIM2 触发
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    TIM3->PSC = 72 - 1;          // 1MHz
    TIM3->ARR = 1000 - 1;
    
    // 从模式：TIM2更新触发TIM3
    TIM3->SMCR |= 0x0007;        // SMS = 111 (从模式从选)
    TIM3->SMCR |= 0x0030;        // TS = 011 (TI1FP1)
    TIM3->SMCR |= 0x0060;        // SMS = 110 (触发模式)
    
    TIM3->CR1 |= 0x0001;
}
```

---

## 十、定时器应用案例

### 10.1 LED 呼吸灯

```c
void LED_Breathing_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_TIM1, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_8;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1;
    TIM_TimeBaseStructure.TIM_Period = 1000 - 1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM1, &TIM_TimeBaseStructure);
    
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM1, &TIM_OCInitStructure);
    
    TIM_CtrlPWMOutputs(TIM1, ENABLE);
    TIM_Cmd(TIM1, ENABLE);
}

int main(void) {
    int16_t duty = 0;
    int8_t dir = 1;
    
    LED_Breathing_Init();
    
    while (1) {
        duty += dir * 5;
        
        if (duty >= 1000) {
            duty = 1000;
            dir = -1;
        } else if (duty <= 0) {
            duty = 0;
            dir = 1;
        }
        
        TIM1->CCR1 = duty;
        delay_ms(20);
    }
}
```

### 10.2 直流电机速度控制

```c
#define MOTOR_PWM_PIN GPIO_Pin_9
#define MOTOR_DIR_PIN GPIO_Pin_8

void Motor_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_TIM1, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    
    // PWM 输出 (PA9)
    GPIO_InitStructure.GPIO_Pin = MOTOR_PWM_PIN;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 方向控制 (PB8)
    GPIO_InitStructure.GPIO_Pin = MOTOR_DIR_PIN;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
    
    TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1;       // 1MHz
    TIM_TimeBaseStructure.TIM_Period = 10000 - 1;       // 100Hz
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM1, &TIM_TimeBaseStructure);
    
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM1, &TIM_OCInitStructure);
    
    TIM_CtrlPWMOutputs(TIM1, ENABLE);
    TIM_Cmd(TIM1, ENABLE);
}

void Motor_SetSpeed(int16_t speed) {
    // speed: -10000 ~ 10000
    if (speed > 0) {
        GPIO_SetBits(GPIOB, MOTOR_DIR_PIN);
        TIM1->CCR1 = speed;
    } else if (speed < 0) {
        GPIO_ResetBits(GPIOB, MOTOR_DIR_PIN);
        TIM1->CCR1 = -speed;
    } else {
        TIM1->CCR1 = 0;
    }
}
```

### 10.3 编码器测速

```c
#define ENCODER_RESOLUTION 400  // 编码器每圈脉冲数

volatile int16_t encoder_count = 0;
volatile float motor_speed = 0;

void Encoder_Speed_Init(void) {
    // TIM2 用于编码器计数
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    
    // PA0/PA1 配置为编码器输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    TIM_EncoderInterfaceConfig(TIM2, TIM_EncoderMode_TI1, TIM_ICPolarity_Rising, TIM_ICPolarity_Rising);
    TIM2->ARR = 0xFFFF;
    TIM2->CNT = 0x8000;  // 中心值
    TIM_Cmd(TIM2, ENABLE);
    
    // TIM3 用于定时测速（100ms）
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    TIM3->PSC = 7200 - 1;
    TIM3->ARR = 1000 - 1;
    TIM_ITConfig(TIM3, TIM_IT_Update, ENABLE);
    TIM_Cmd(TIM3, ENABLE);
}

void TIM3_IRQHandler(void) {
    static int16_t last_count = 0;
    int16_t current_count;
    
    if (TIM_GetITStatus(TIM3, TIM_IT_Update) != RESET) {
        current_count = TIM2->CNT - 0x8000;
        encoder_count = current_count - last_count;
        last_count = current_count;
        
        // 计算转速（转/秒）
        // encoder_count 是 100ms 的脉冲数
        motor_speed = (encoder_count * 10.0 * 60.0) / ENCODER_RESOLUTION;
        
        TIM_ClearITPendingBit(TIM3, TIM_IT_Update);
    }
}
```

---

## 十一、注意事项

### 11.1 时钟配置注意

| APB 总线 | 定时器时钟 | 说明 |
|----------|-----------|------|
| APB1 | 36MHz (72MHz / 2) | TIM2~TIM7 |
| APB2 | 72MHz | TIM1, TIM8 |

**注意**：当 APB1 时钟为 36MHz 时，定时器时钟实际为 72MHz（因为定时器时钟来自 APB1 × 2）。

### 11.2 ARR 和 PSC 注意点

- PSC 范围：0~65535
- ARR 范围：0~65535
- 修改 ARR 前应先禁用计数器
- 预装载寄存器需要 TIM_ARRPreloadConfig(ENABLE) 才能在更新事件时生效

### 11.3 PWM 抖动问题

**原因**：ARR 值太小，导致 PWM 分辨率不足

**解决**：
```c
// 增大 ARR 值以获得更平滑的 PWM
TIM_TimeBaseStructure.TIM_Period = 10000 - 1;  // 0.01% 分辨率
TIM_TimeBaseStructure.TIM_Prescaler = 1 - 1;   // 适当调整
```

---

## 十二、总结

| 知识点 | 重点内容 |
|--------|----------|
| 定时器分类 | 基本定时器（简单定时）、通用定时器（捕获/PWM）、高级定时器（电机控制） |
| 时基单元 | PSC（分频）、ARR（溢出值）、CNT（计数器） |
| 计数模式 | 向上/向下/中心对齐 |
| PWM 输出 | 调节占空比控制负载功率 |
| PWM 输入 | 测量外部信号频率和占空比 |
| 编码器模式 | 正交编码器计数测速 |
| 寄存器操作 | 直接操作寄存器实现精确控制 |
