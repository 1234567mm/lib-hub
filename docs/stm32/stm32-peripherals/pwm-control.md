---
title: PWM 控制
---

PWM（Pulse Width Modulation，脉宽调制）是一种利用数字信号控制模拟电路的技术，通过改变脉冲信号的占空比来控制输出功率。STM32 的定时器外设能够输出多路 PWM 信号，广泛应用于电机控制、LED 调光、电源管理、音频输出等领域。本文档详细介绍 PWM 的工作原理、参数配置、STM32 定时器 PWM 模式以及实际应用。

## PWM 原理

### 什么是 PWM

PWM 是一种周期固定、脉冲宽度可变的信号：

```
         ┌──────────┐          ┌──────────┐
         │          │          │          │
    ─────┘          └──────────┘          └────
    ────────────────────────────────────────────
    |<──── T ────>|
    |<─ Ton ──>|
    
    T = 周期（固定）
    Ton = 高电平时间（可变）
    Toff = T - Ton = 低电平时间
```

### 占空比（Duty Cycle）

占空比是 PWM 信号中高电平时间占整个周期的比例：

```
占空比 (%) = (Ton / T) × 100%
```

**示例**：
| Ton | T | 占空比 | 平均电压（3.3V） |
|-----|---|--------|------------------|
| 0.3ms | 1ms | 30% | 0.99V |
| 0.5ms | 1ms | 50% | 1.65V |
| 0.8ms | 1ms | 80% | 2.64V |

### 平均电压计算

PWM 信号的平均电压与占空比成正比：

```
Vavg = Vcc × 占空比
```

对于 3.3V 系统：
- 0% 占空比 → 0V
- 50% 占空比 → 1.65V
- 100% 占空比 → 3.3V

### PWM 的应用

| 应用场景 | 说明 |
|----------|------|
| LED 调光 | 控制 LED 的亮度，通过改变占空比实现 |
| 电机控制 | 控制直流电机的转速，PWM 频率决定响应特性 |
| 舵机控制 | 舵机通常使用 50Hz PWM，脉宽 0.5ms~2.5ms 对应角度 |
| 音频输出 | PWM 输出经过滤波后可以播放音频 |
| 电源管理 | 开关电源中用 PWM 控制输出电压 |

## PWM 参数

### 频率（Frequency）

PWM 周期 T 的倒数决定频率：

```
f = 1 / T
```

常见 PWM 频率：
| 应用 | 典型频率 |
|------|----------|
| LED 调光 | 100Hz~1kHz（避免闪烁） |
| 电机控制 | 1kHz~20kHz（避免噪声） |
| 舵机控制 | 50Hz（20ms 周期） |
| 开关电源 | 100kHz~1MHz |

### 占空比（Duty Cycle）

占空比决定了输出功率或信号的有效值。

### 分辨率（Resolution）

PWM 分辨率决定了占空比调节的精细程度：

| 定时器位数 | 最大计数值 | 分辨率（频率 1kHz 时） |
|------------|-----------|------------------------|
| 8 位 | 255 | 0.39%（1/255） |
| 16 位 | 65535 | 0.0015%（1/65535） |

STM32 定时器为 16 位，因此具有很高的分辨率。

### 极性（Polarity）

PWM 输出极性决定有效电平：
- **高极性**：占空比越大，有效输出越高
- **低极性**：占空比越大，有效输出越低

## STM32 定时器 PWM 模式

### 定时器 PWM 输出原理

STM32 定时器的 PWM 输出基于定时器的比较匹配机制：

```
         ┌────────────────────────────────────────┐
         │              定时器计数器 (CNT)         │
         │  0 ──────────────────────────────────► ARR
         └────────────────────────────────────────┘
                        ▲
                        │
         ┌──────────────┴───────────────┐
         │      自动重装载寄存器       │
         │         (ARR)               │
         └─────────────────────────────┘

         ┌────────────────────────────┐
         │      比较寄存器 (CCR)       │
         │     可通过软件设置          │
         └────────────────────────────┘
         
         │ CCR  │
         └──────┴────────────► 比较输出
```

### PWM 模式 1 和模式 2

| 模式 | 计数器方向 | 输出模式 |
|------|-----------|----------|
| PWM 模式 1 | 递增 | CNT < CCR 时输出有效电平 |
| PWM 模式 2 | 递增 | CNT < CCR 时输出无效电平 |

**PWM 模式 1**（最常用）：
- 当 CNT < CCR 时，输出高电平（有效电平）
- 当 CNT >= CCR 时，输出低电平（无效电平）

### PWM 输出引脚

STM32F1 定时器 PWM 输出引脚：

| 定时器 | 通道 | GPIO | 重映射 |
|--------|------|------|--------|
| TIM1 | CH1 | PA8 | |
| TIM1 | CH2 | PA9 | |
| TIM1 | CH3 | PA10 | |
| TIM1 | CH4 | PA11 | |
| TIM2 | CH1 | PA0 | |
| TIM2 | CH2 | PA1 | |
| TIM2 | CH3 | PA2 | |
| TIM2 | CH4 | PA3 | |
| TIM3 | CH1 | PA6 | |
| TIM3 | CH2 | PA7 | |
| TIM3 | CH3 | PB0 | |
| TIM3 | CH4 | PB1 | |
| TIM4 | CH1 | PB6 | |
| TIM4 | CH2 | PB7 | |
| TIM4 | CH3 | PB8 | |
| TIM4 | CH4 | PB9 | |

**注意**：TIM1 是高级定时器，输出引脚在通道设为 PWM 时自动使能互补输出（需要配置）。

## 定时器寄存器详解

### TIMx_CRR - 计数器寄存器

存储当前计数器的值，16 位。

### TIMx_ARR - 自动重装载寄存器

决定 PWM 周期：

```
PWM 周期 = (ARR + 1) × 定时器时钟周期
```

### TIMx_CCRx - 比较寄存器（x = 1~4）

决定 PWM 的占空比：

```
占空比 = CCR / (ARR + 1) × 100%
```

### TIMx_CCMRx - 捕获/比较模式寄存器

配置 PWM 模式：

| 位 | 名称 | 说明 |
|----|------|------|
| 6:3 | OCxM[2:0] | 输出比较模式 |
| 2  | OCxPE     | 输出比较预装载使能 |
| 1  | OCxFE     | 输出比较快速使能 |

**OCxM 位设置**：
| 值 | 模式 |
|----|------|
| 110 | PWM 模式 1 |
| 111 | PWM 模式 2 |

### TIMx_CCER - 捕获/比较使能寄存器

| 位 | 名称 | 说明 |
|----|------|------|
| 0  | CC1E | CH1 输出使能 |
| 1  | CC1P | CH1 极性（0=高有效，1=低有效） |
| 4  | CC2E | CH2 输出使能 |
| 5  | CC2P | CH2 极性 |

### TIMx_BDTR - 死区控制和刹车寄存器

| 位 | 名称 | 说明 |
|----|------|------|
| 15 | MOE  | 主输出使能（高级定时器） |
| 14 | AOE  | 自动输出使能 |
| 12:8 | DTG[7:0] | 死区发生器设置 |
| 7  | BKE   | 刹车功能使能 |
| 6  | BKP   | 刹车极性 |

## 标准库 PWM 配置

### GPIO 配置

```c
void TIM3_GPIO_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    // 使能 GPIO 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_GPIOB, ENABLE);

    // 配置 TIM3 CH1 (PA6), CH2 (PA7) 为复用推挽输出
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;           // 复用推挽输出
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 配置 TIM3 CH3 (PB0), CH4 (PB1)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
}
```

### TIM3 PWM 初始化

```c
void TIM3_PWM_Config(void)
{
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;

    // 使能 TIM3 时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);

    // 配置时基
    // PWM 频率 = 72MHz / (预分频 + 1) / (ARR + 1)
    // 例如：72MHz / 720 / 100 = 1kHz
    TIM_TimeBaseStructure.TIM_Period = 999;          // ARR = 999（周期 = 1000）
    TIM_TimeBaseStructure.TIM_Prescaler = 71;         // 预分频 = 72-1 = 71
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;  // 递增计数
    TIM_TimeBaseInit(TIM3, &TIM_TimeBaseStructure);

    // 配置 PWM 输出
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;          // PWM 模式 1
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;  // 输出使能
    TIM_OCInitStructure.TIM_Pulse = 500;                       // 初始占空比 50%
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;  // 高极性
    TIM_OCInitStructure.TIM_OCIdleState = TIM_OCIdleState_Set;

    // 初始化 TIM3 的 4 个通道
    TIM_OC1Init(TIM3, &TIM_OCInitStructure);  // CH1
    TIM_OC2Init(TIM3, &TIM_OCInitStructure);  // CH2
    TIM_OC3Init(TIM3, &TIM_OCInitStructure);  // CH3
    TIM_OC4Init(TIM3, &TIM_OCInitStructure);  // CH4

    // 使能 CCR 预装载（避免 PWM 抖动）
    TIM_OC1PreloadConfig(TIM3, TIM_OCPreload_Enable);
    TIM_OC2PreloadConfig(TIM3, TIM_OCPreload_Enable);
    TIM_OC3PreloadConfig(TIM3, TIM_OCPreload_Enable);
    TIM_OC4PreloadConfig(TIM3, TIM_OCPreload_Enable);

    // 使能 TIM3
    TIM_Cmd(TIM3, ENABLE);
}
```

### 完整初始化

```c
void TIM3_PWM_Init(void)
{
    TIM3_GPIO_Config();
    TIM3_PWM_Config();
}
```

## PWM 函数

### 设置占空比

```c
// 设置通道 1 占空比 (0-100%)
void TIM3_SetDutyCycle_CH1(uint16_t duty)
{
    uint32_t pulse = (duty * (TIM3->ARR + 1)) / 100;
    TIM3->CCR1 = pulse;
}

// 设置通道 2 占空比
void TIM3_SetDutyCycle_CH2(uint16_t duty)
{
    uint32_t pulse = (duty * (TIM3->ARR + 1)) / 100;
    TIM3->CCR2 = pulse;
}

// 使用标准库函数
void TIM3_SetCompare1(uint16_t compare)
{
    TIM_SetCompare1(TIM3, compare);
}

void TIM3_SetCompare2(uint16_t compare)
{
    TIM_SetCompare2(TIM3, compare);
}
```

### 设置频率

```c
// 设置 PWM 频率（单位 Hz）
void TIM3_SetFrequency(uint32_t freq)
{
    uint32_t period = 72000000 / freq - 1;
    TIM3->ARR = period;
}

// 例如：设置 20kHz PWM
TIM3_SetFrequency(20000);
```

### 启动/停止 PWM

```c
// 启动 PWM 输出
void TIM3_PWM_Start(void)
{
    TIM_Cmd(TIM3, ENABLE);
}

// 停止 PWM 输出
void TIM3_PWM_Stop(void)
{
    TIM_Cmd(TIM3, DISABLE);
}

// 单独使能/禁止通道
void TIM3_CH1_Enable(void)
{
    TIM_CCPreloadConfig(TIM3, TIM_CCPreload_Enable);
}

void TIM3_CH1_Disable(void)
{
    TIM_CCxCmd(TIM3, TIM_Channel_1, TIM_CCx_Disable);
}
```

## 占空比计算工具函数

```c
/**
 * 计算给定频率和占空比的 CCR 值
 */
uint16_t CalculateCCR(uint32_t freq, uint8_t duty_percent)
{
    // 系统时钟 72MHz，APB1 定时器时钟 72MHz
    uint32_t arr = 72000000 / freq - 1;
    return (duty_percent * (arr + 1)) / 100;
}

/**
 * 设置 PWM 参数
 */
void TIM3_SetPWM(uint32_t freq, uint8_t duty_percent)
{
    // 设置频率
    TIM3->ARR = 72000000 / freq - 1;

    // 设置占空比
    uint16_t ccr = (duty_percent * (TIM3->ARR + 1)) / 100;
    TIM3->CCR1 = ccr;
    TIM3->CCR2 = ccr;
    TIM3->CCR3 = ccr;
    TIM3->CCR4 = ccr;
}
```

## 高级定时器 PWM

TIM1 是高级定时器，支持互补输出和死区控制，常用于电机控制：

### TIM1 PWM 配置

```c
void TIM1_PWM_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;
    TIM_BDTRInitTypeDef TIM_BDTRInitStructure;

    // 使能 GPIO 和 TIM1 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_TIM1, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    // 配置 GPIO：CH1 (PA8), CH1N (PA7), CH2 (PA9), CH2N (PB0)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_8 | GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_7;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_Init(GPIOB, &GPIO_InitStructure);

    // 配置时基
    TIM_TimeBaseStructure.TIM_Period = 7199;          // 10kHz PWM
    TIM_TimeBaseStructure.TIM_Prescaler = 0;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_RepetitionCounter = 0;
    TIM_TimeBaseInit(TIM1, &TIM_TimeBaseStructure);

    // 配置 PWM 输出
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_OutputNState = TIM_OutputNState_Enable;  // 使能互补输出
    TIM_OCInitStructure.TIM_Pulse = 3600;           // 50% 占空比
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OCInitStructure.TIM_OCNPolarity = TIM_OCNPolarity_High;
    TIM_OCInitStructure.TIM_OCIdleState = TIM_OCIdleState_Reset;
    TIM_OCInitStructure.TIM_OCNIdleState = TIM_OCNIdleState_Reset;
    TIM_OC1Init(TIM1, &TIM_OCInitStructure);

    // 配置死区和刹车
    TIM_BDTRInitStructure.TIM_OSSRState = TIM_OSSRState_Enable;
    TIM_BDTRInitStructure.TIM_OSSIState = TIM_OSSIState_Enable;
    TIM_BDTRInitStructure.TIM_LOCKLevel = TIM_LOCKLevel_1;
    TIM_BDTRInitStructure.TIM_DeadTime = 0xFF;      // 死区时间
    TIM_BDTRInitStructure.TIM_Break = TIM_Break_Disable;
    TIM_BDTRInitStructure.TIM_BreakPolarity = TIM_BreakPolarity_High;
    TIM_BDTRInitStructure.TIM_AutomaticOutput = TIM_AutomaticOutput_Disable;
    TIM_BDTRConfig(TIM1, &TIM_BDTRInitStructure);

    // 使能预装载
    TIM_OC1PreloadConfig(TIM1, TIM_OCPreload_Enable);

    // 使能 TIM1
    TIM_Cmd(TIM1, ENABLE);
    TIM_CtrlPWMOutputs(TIM1, ENABLE);  // 必须使能主输出
}
```

## 舵机控制 PWM

舵机通常使用 50Hz PWM 信号（周期 20ms），通过改变脉冲宽度控制角度：

| 脉宽 | 占空比（ARR=19999） | 角度 |
|------|----------------------|------|
| 0.5ms | 999 | 0° |
| 1.0ms | 1999 | 45° |
| 1.5ms | 2999 | 90° |
| 2.0ms | 3999 | 135° |
| 2.5ms | 4999 | 180° |

### 舵机初始化

```c
#define SERVO_ARR    19999   // 20ms 周期 (50Hz)
#define SERVO_MIN    999     // 0.5ms (0°)
#define SERVO_MAX    4999    // 2.5ms (180°)
#define SERVO_MID    2999    // 1.5ms (90°)

void Servo_Init(void)
{
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;

    // 使用 TIM2 CH1 (PA0)
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    // GPIO 配置
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // TIM2 配置：72MHz / 72 / 20000 = 50Hz
    TIM_TimeBaseStructure.TIM_Period = SERVO_ARR;
    TIM_TimeBaseStructure.TIM_Prescaler = 71;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseStructure);

    // PWM 配置
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = SERVO_MID;  // 默认中间位置
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM2, &TIM_OCInitStructure);

    TIM_OC1PreloadConfig(TIM2, TIM_OCPreload_Enable);
    TIM_Cmd(TIM2, ENABLE);
}
```

### 舵机角度控制

```c
/**
 * 控制舵机角度
 * @param angle: 角度值 0~180
 */
void Servo_SetAngle(uint16_t angle)
{
    if (angle > 180) angle = 180;

    uint32_t pulse = SERVO_MIN + (angle * (SERVO_MAX - SERVO_MIN) / 180);
    TIM_SetCompare1(TIM2, pulse);
}

/**
 * 将舵机转到中间位置 (90°)
 */
void Servo_Center(void)
{
    TIM_SetCompare1(TIM2, SERVO_MID);
}
```

## LED 呼吸灯

PWM 实现 LED 亮度渐变效果：

```c
#define LED_ARR    255
#define LED_TIM    TIM2
#define LED_CHANNEL TIM_Channel_3

void LED_Breathing_Init(void)
{
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;

    // TIM2 CH3 (PA2)
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_2;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // 256 级亮度，频率约 280Hz
    TIM_TimeBaseStructure.TIM_Period = LED_ARR;
    TIM_TimeBaseStructure.TIM_Prescaler = 0;  // 72MHz / 256 ≈ 281kHz
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseStructure);

    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC3Init(TIM2, &TIM_OCInitStructure);

    TIM_OC3PreloadConfig(TIM2, TIM_OCPreload_Enable);
    TIM_Cmd(TIM2, ENABLE);
}

// 呼吸灯效果
void LED_Breathing(void)
{
    static int16_t direction = 1;
    static uint8_t brightness = 0;

    brightness += direction;

    if (brightness >= 255) direction = -1;
    if (brightness == 0) direction = 1;

    TIM_SetCompare3(TIM2, brightness);
    delay_ms(10);
}
```

## 直流电机 PWM 控制

使用 PWM 控制直流电机转速：

```c
#define MOTOR_ARR   19999   // 1kHz PWM
#define MOTOR_TIM   TIM4
#define MOTOR_CH1   TIM_Channel_1  // PB6
#define MOTOR_CH2   TIM_Channel_2  // PB7

void Motor_Init(void)
{
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    TIM_OCInitTypeDef TIM_OCInitStructure;

    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM4, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);

    // GPIO 配置
    GPIO_InitTypeDef GPIO_InitStructure;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOB, &GPIO_InitStructure);

    // TIM4 配置：72MHz / 72 / 20000 = 50Hz
    TIM_TimeBaseStructure.TIM_Period = MOTOR_ARR;
    TIM_TimeBaseStructure.TIM_Prescaler = 71;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInit(TIM4, &TIM_TimeBaseStructure);

    // CH1 PWM 配置
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM4, &TIM_OCInitStructure);

    // CH2 PWM 配置
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OC2Init(TIM4, &TIM_OCInitStructure);

    TIM_Cmd(TIM4, ENABLE);
}

/**
 * 设置电机转速
 * @param speed: -100 ~ +100，正值正转，负值反转
 */
void Motor_SetSpeed(int16_t speed)
{
    if (speed > 100) speed = 100;
    if (speed < -100) speed = -100;

    int16_t abs_speed = speed > 0 ? speed : -speed;

    if (speed >= 0)
    {
        TIM_SetCompare1(TIM4, abs_speed * MOTOR_ARR / 100);  // CH1 正转
        TIM_SetCompare2(TIM4, 0);                             // CH2 停止
    }
    else
    {
        TIM_SetCompare1(TIM4, 0);                             // CH1 停止
        TIM_SetCompare2(TIM4, abs_speed * MOTOR_ARR / 100); // CH2 反转
    }
}
```

## 常见问题

### 1. PWM 无输出

**排查步骤**：
1. 检查 GPIO 配置是否为复用输出
2. 确认定时器时钟已使能
3. 检查 CCxE 位是否置 1
4. 对于高级定时器，检查 MOE 位和 CCxE 位

### 2. PWM 频率设置错误

**检查计算公式**：

```
PWM 频率 = TIMxCLK / ((ARR + 1) × (PSC + 1))
```

例如：72MHz 时钟，ARR=999，PSC=71

```
频率 = 72000000 / ((999 + 1) × (71 + 1)) = 72000000 / 72000 = 1000Hz
```

### 3. 占空比不正确

**检查 CCR 和 ARR 的关系**：

```c
占空比 = CCR / (ARR + 1)
```

如果期望 50% 占空比：
- ARR = 999 → CCR = 500
- ARR = 1999 → CCR = 1000

### 4. 多通道 PWM 互相干扰

**原因**：同时修改 ARR 和 CCR 可能导致输出异常

**解决**：使用影子寄存器（预装载功能）

```c
// 使能 ARR 预装载
TIM_ARRPreloadConfig(TIM3, ENABLE);

// 使能 CCR 预装载
TIM_OCxPreloadConfig(TIM3, TIM_OCPreload_Enable);
```

## 总结

PWM 是嵌入式开发中非常重要的技术：

- **占空比控制**：通过改变占空比实现功率/亮度控制
- **频率选择**：不同应用需要不同的 PWM 频率
- **分辨率**：16 位定时器提供高精度控制
- **死区控制**：高级定时器支持互补输出和死区，用于 H 桥驱动
- **应用广泛**：LED 调光、电机控制、舵机控制、电源管理等

掌握 STM32 的 PWM 输出配置对于各种控制应用至关重要。
