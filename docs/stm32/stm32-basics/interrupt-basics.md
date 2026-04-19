---
title: 中断基础
---

# 中断基础

本文系统讲解 STM32 中断机制、NVIC 优先级配置、外部中断及标准库使用方法。

---

## 一、什么是中断

### 1.1 中断的概念

**中断（Interrupt）**是 MCU 响应内部或外部事件的一种机制。当中断发生时，CPU 会暂停当前正在执行的任务，转而去执行一个**中断服务例程（ISR, Interrupt Service Routine）**，处理完中断事件后再返回继续执行原来的任务。

**生活中的类比**：
> 你在看书时突然收到一条微信，你会暂停看书（主任务），拿起手机回复消息（中断处理），然后继续看书（返回主任务）。

### 1.2 轮询 vs 中断

| 方式 | 特点 | 适用场景 |
|------|------|----------|
| 轮询（Polling） | CPU 不断检查外设状态 | 简单场景、实时性要求不高 |
| 中断（Interrupt） | 外设主动通知CPU | 实时性要求高、多外设协同 |

**轮询的缺点**：
- CPU 资源浪费在不断查询上
- 实时性差，事件响应不及时
- 多外设时难以协调

**中断的优点**：
- CPU 无需等待，可以执行其他任务
- 响应及时，不遗漏事件
- 多外设可以并行工作

---

## 二、NVIC 嵌套向量中断控制器

### 2.1 什么是 NVIC

**NVIC（Nested Vectored Interrupt Controller）**是 ARM Cortex-M 内核提供的中断控制器，负责：

- 管理和配置所有外设中断
- 处理中断优先级
- 向量中断跳转
- 支持中断嵌套和咬尾（Tail-Chaining）机制

STM32F103 系列支持**84个中断**（具体数量因型号而异）。

### 2.2 NVIC 基本结构

```
                    ┌─────────────────────────────┐
                    │         内核 (Cortex-M3)   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │            NVIC             │
                    │  ┌─────────────────────┐  │
                    │  │ 中断使能寄存器        │  │
                    │  │ (ISER)               │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │ 中断除能寄存器       │  │
                    │  │ (ICER)              │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │ 优先级寄存器        │  │
                    │  │ (IPR[0-83])         │  │
                    │  └─────────────────────┘  │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────┴────────┐   ┌────────┴────────┐   ┌────────┴────────┐
     │   EXTI (外部)   │   │   TIM2 (定时器) │   │  USART1 (串口)  │
     └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.3 中断通道（IRQn）

STM32F103 的常用中断通道：

| IRQn | 说明 | 优先级 |
|------|------|--------|
| WWDG_IRQn | 窗口看门狗中断 | 最高 |
| PVD_IRQn | PVD中断 | |
| TIM1_BRK_IRQn | TIM1刹车中断 | |
| TIM1_UP_IRQn | TIM1更新中断 | |
| TIM1_TRG_COM_IRQn | TIM1触发/通信中断 | |
| TIM1_CC_IRQn | TIM1捕获比较中断 | |
| TIM2_IRQn | TIM2全局中断 | |
| TIM3_IRQn | TIM3全局中断 | |
| TIM4_IRQn | TIM4全局中断 | |
| I2C1_EV_IRQn | I2C1事件中断 | |
| I2C1_ER_IRQn | I2C1错误中断 | |
| SPI1_IRQn | SPI1中断 | |
| USART1_IRQn | USART1全局中断 | |
| USART2_IRQn | USART2全局中断 | |
| EXTI0_IRQn | 外部中断0 | |
| EXTI1_IRQn | 外部中断1 | |
| ... | ... | |
| EXTI15_10_IRQn | 外部中断10-15 | 最低 |

---

## 三、中断优先级

### 3.1 优先级分组

STM32 使用**4位二进制**表示优先级（0~15，数字越小优先级越高）。

NVIC 支持**优先级分组**，将优先级分为**抢占优先级**和**响应优先级**：

| 分组 | 抢占优先级 | 响应优先级 | 说明 |
|------|------------|-----------|------|
| NVIC_PriorityGroup_0 | 0位 | 4位 | 全部为响应优先级 |
| NVIC_PriorityGroup_1 | 1位 | 3位 | 2级抢占 |
| NVIC_PriorityGroup_2 | 2位 | 2位 | 4级抢占 |
| NVIC_PriorityGroup_3 | 3位 | 1位 | 8级抢占 |
| NVIC_PriorityGroup_4 | 4位 | 0位 | 全部为抢占优先级 |

### 3.2 优先级比较规则

1. **先比较抢占优先级**：抢占优先级高的可以打断低的
2. **抢占优先级相同时**：比较响应优先级
3. **都相同时**：比较硬件中断编号（编号小的优先）

### 3.3 优先级配置示例

```c
// 使用标准库配置优先级
void NVIC_Configuration(void) {
    NVIC_InitTypeDef NVIC_InitStructure;
    
    // 配置优先级分组为 2位抢占优先级 + 2位响应优先级
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    
    // 配置 TIM2 中断
    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;  // 抢占优先级 1
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;          // 响应优先级 1
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
}
```

### 3.4 优先级设计原则

| 场景 | 优先级建议 |
|------|------------|
| 硬实时（电机控制） | 高抢占优先级（0~2） |
| 软实时（通信） | 中等优先级（3~6） |
| 低实时（显示刷新） | 低优先级（7~12） |
| 后台任务 | 最低优先级（13~15） |

**注意事项**：
- 优先级数字越小，优先级越高
- 最高优先级（0）通常留给紧急事件
- 避免使用太多相同优先级

---

## 四、外部中断（EXTI）

### 4.1 EXTI 简介

**EXTI（External Interrupt/Event Controller）**是外部中断/事件控制器，用于处理来自 GPIO 引脚的外部中断。

STM32F103 EXTI 特性：
- 最多支持 **19个外部中断线**
- 每个 GPIO 端口的同一引脚号共享一个 EXTI 线
- 支持中断或事件触发

### 4.2 EXTI 通道映射

| EXTI线 | GPIO 源 | 说明 |
|--------|---------|------|
| EXTI0 | PA0/PB0/PC0/PD0/PE0 | 同一时刻只能选择一个 |
| EXTI1 | PA1/PB1/PC1/PD1/PE1 | |
| EXTI2 | PA2/PB2/PC2/PD2/PE2 | |
| ... | ... | |
| EXTI15 | PA15/PB15/PC15/PD15/PE15 | |

### 4.3 EXTI 触发方式

| 触发方式 | 说明 |
|----------|------|
| 上升沿触发 | 检测到高电平变化 |
| 下降沿触发 | 检测到低电平变化 |
| 双边沿触发 | 上升沿和下降沿都触发 |

### 4.4 EXTI 配置步骤

```c
#include "stm32f10x.h"

void EXTI0_Configuration(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    EXTI_InitTypeDef EXTI_InitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;
    
    // 1. 使能GPIOA和AFIO时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_AFIO, ENABLE);
    
    // 2. 配置PA0为浮空输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 3. 将PA0连接到EXTI0
    GPIO_EXTILineConfig(GPIO_PortSourceGPIOA, GPIO_PinSource0);
    
    // 4. 配置EXTI0
    EXTI_InitStructure.EXTI_Line = EXTI_Line0;
    EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;  // 中断模式
    EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Falling;  // 下降沿触发
    EXTI_InitStructure.EXTI_LineCmd = ENABLE;
    EXTI_Init(&EXTI_InitStructure);
    
    // 5. 配置NVIC
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    NVIC_InitStructure.NVIC_IRQChannel = EXTI0_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
}

// 6. 编写中断服务例程
void EXTI0_IRQHandler(void) {
    if (EXTI_GetITStatus(EXTI_Line0) != RESET) {
        // 中断处理代码
        // ...
        
        // 清除中断标志
        EXTI_ClearITPendingBit(EXTI_Line0);
    }
}
```

### 4.5 EXTI 常见应用：按键中断

```c
#include "stm32f10x.h"

#define KEY1_PIN GPIO_Pin_0
#define KEY2_PIN GPIO_Pin_1

volatile uint8_t key1_pressed = 0;
volatile uint8_t key2_pressed = 0;

void Key_Interrupt_Init(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    EXTI_InitTypeDef EXTI_InitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB | RCC_APB2Periph_AFIO, ENABLE);
    
    // 配置PB0和PB1为上拉输入
    GPIO_InitStructure.GPIO_Pin = KEY1_PIN | KEY2_PIN;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
    
    // 连接EXTI线到GPIOB
    GPIO_EXTILineConfig(GPIO_PortSourceGPIOB, GPIO_PinSource0);
    GPIO_EXTILineConfig(GPIO_PortSourceGPIOB, GPIO_PinSource1);
    
    // 配置EXTI0（PB0），下降沿触发
    EXTI_InitStructure.EXTI_Line = EXTI_Line0;
    EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;
    EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Falling;
    EXTI_InitStructure.EXTI_LineCmd = ENABLE;
    EXTI_Init(&EXTI_InitStructure);
    
    // 配置EXTI1（PB1），下降沿触发
    EXTI_InitStructure.EXTI_Line = EXTI_Line1;
    EXTI_Init(&EXTI_InitStructure);
    
    // 配置NVIC
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    
    // EXTI0优先级
    NVIC_InitStructure.NVIC_IRQChannel = EXTI0_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
    
    // EXTI1优先级
    NVIC_InitStructure.NVIC_IRQChannel = EXTI1_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
    NVIC_Init(&NVIC_InitStructure);
}

// EXTI0中断服务例程
void EXTI0_IRQHandler(void) {
    if (EXTI_GetITStatus(EXTI_Line0) != RESET) {
        key1_pressed = 1;
        EXTI_ClearITPendingBit(EXTI_Line0);
    }
}

// EXTI1中断服务例程
void EXTI1_IRQHandler(void) {
    if (EXTI_GetITStatus(EXTI_Line1) != RESET) {
        key2_pressed = 1;
        EXTI_ClearITPendingBit(EXTI_Line1);
    }
}

int main(void) {
    Key_Interrupt_Init();
    
    while (1) {
        if (key1_pressed) {
            key1_pressed = 0;
            // 处理KEY1按下
        }
        if (key2_pressed) {
            key2_pressed = 0;
            // 处理KEY2按下
        }
    }
}
```

---

## 五、中断向量表

### 5.1 什么是中断向量表

**中断向量表**是一段存储在 Flash 开始地址的表格，每个中断都对应一个**向量地址**。当发生中断时，CPU 根据中断编号跳转到向量表相应位置，然后跳转到 ISR 执行。

### 5.2 STM32F103 中断向量表（部分）

| 地址 | IRQn | 说明 |
|------|------|------|
| 0x0000_0000 | - | 复位 |
| 0x0000_0004 | - | NMI |
| 0x0000_0008 | HardFault_IRQn | 硬件 fault |
| 0x0000_000C | - | 内存管理 fault |
| ... | ... | ... |
| 0x0000_001C | BusFault_IRQn | 总线 fault |
| 0x0000_0020 | UsageFault_IRQn | 用法 fault |
| 0x0000_0024 | - | 保留 |
| 0x0000_0028 | SVCall_IRQn | 系统服务调用 |
| ... | ... | ... |
| 0x0000_003C | PendSV_IRQn | 可挂起 SV |
| 0x0000_0040 | SysTick_IRQn | SysTick 定时器 |
| 0x0000_0044 | WWDG_IRQn | 窗口看门狗 |
| ... | ... | ... |
| 0x0000_0054 | EXTI0_IRQn | 外部中断0 |
| 0x0000_0058 | EXTI1_IRQn | 外部中断1 |
| ... | ... | ... |
| 0x0000_0074 | TIM2_IRQn | TIM2全局中断 |
| 0x0000_0078 | TIM3_IRQn | TIM3全局中断 |
| ... | ... | ... |

### 5.3 中断向量表位置

STM32F103 中断向量表位于 **Flash 起始地址（0x0800_0000）**，但可以通过 SYSCFG 配置重映射到 SRAM。

```c
// 将中断向量表重映射到SRAM（用于 bootloader 场景）
void VectorTableRemap(void) {
    // 启用SRAM时钟
    RCC->AHBENR |= RCC_AHBENR_SRAMEN;
    
    // 设置向量表偏移寄存器
    SCB->VTOR = SRAM_START_ADDR;  // 0x2000_0000
}
```

---

## 六、定时器中断

### 6.1 TIM2 定时器中断配置

```c
#include "stm32f10x.h"

volatile uint32_t timer2_count = 0;

void TIM2_Init(uint16_t prescaler, uint16_t period) {
    TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure;
    NVIC_InitTypeDef NVIC_InitStructure;
    
    // 1. 使能TIM2时钟
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    
    // 2. 配置TIM2时基单元
    TIM_TimeBaseStructure.TIM_Prescaler = prescaler;      // 预分频值
    TIM_TimeBaseStructure.TIM_Period = period;           // 自动重装载值
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;  // 向上计数
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseStructure);
    
    // 3. 使能TIM2更新中断
    TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE);
    
    // 4. 配置NVIC
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
    
    // 5. 使能TIM2
    TIM_Cmd(TIM2, ENABLE);
}

// TIM2中断服务例程
void TIM2_IRQHandler(void) {
    if (TIM_GetITStatus(TIM2, TIM_IT_Update) != RESET) {
        timer2_count++;
        TIM_ClearITPendingBit(TIM2, TIM_IT_Update);
    }
}

int main(void) {
    // TIM2初始化：72MHz / 7200 / 1000 = 10Hz
    // 每100ms产生一次更新中断
    TIM2_Init(7200 - 1, 1000 - 1);
    
    while (1) {
        // 主循环可以执行其他任务
    }
}
```

### 6.2 多定时器协同

```c
// 配置多个定时器不同优先级
void MultiTimer_Init(void) {
    NVIC_InitTypeDef NVIC_InitStructure;
    
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    
    // TIM2 高优先级（用于精确计时）
    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
    
    // TIM3 低优先级（用于一般任务调度）
    NVIC_InitStructure.NVIC_IRQChannel = TIM3_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
    NVIC_Init(&NVIC_InitStructure);
}
```

---

## 七、串口中断

### 7.1 USART1 中断配置

```c
#include "stm32f10x.h"
#include <stdio.h>

uint8_t rx_buffer[100];
volatile uint8_t rx_head = 0;
volatile uint8_t rx_tail = 0;

void USART1_Init(uint32_t baudrate) {
    GPIO_InitTypeDef GPIO_InitStructure;
    USART_InitTypeDef USART_InitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;
    
    // 1. 使能GPIOA和USART1时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
    
    // 2. 配置USART1的TX(PA9)和RX(PA10)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;  // TX
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;  // RX
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // 3. 配置USART1
    USART_InitStructure.USART_BaudRate = baudrate;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
    USART_Init(USART1, &USART_InitStructure);
    
    // 4. 使能USART1接收中断
    USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);
    
    // 5. 配置NVIC
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    NVIC_InitStructure.NVIC_IRQChannel = USART1_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 3;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);
    
    // 6. 使能USART1
    USART_Cmd(USART1, ENABLE);
}

// USART1中断服务例程
void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET) {
        rx_buffer[rx_head++] = USART_ReceiveData(USART1);
        if (rx_head >= 100) rx_head = 0;
        USART_ClearITPendingBit(USART1, USART_IT_RXNE);
    }
}

// 发送字符
void USART1_SendChar(uint8_t ch) {
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
    USART_SendData(USART1, ch);
}

// 发送字符串
void USART1_SendString(uint8_t *str) {
    while (*str) {
        USART1_SendChar(*str++);
    }
}

int main(void) {
    USART1_Init(115200);
    USART1_SendString("USART1 Initialized\r\n");
    
    while (1) {
        // 处理接收到的数据
    }
}
```

### 7.2 printf 重定向到 USART

```c
// 需要勾选 Use MicroLIB (Project -> Options -> Target -> Code Generation)

#include <stdio.h>

int fputc(int ch, FILE *f) {
    USART1_SendChar((uint8_t)ch);
    return ch;
}

int main(void) {
    USART1_Init(115200);
    printf("Hello, STM32!\r\n");
    printf("Timer count: %d\r\n", timer2_count);
}
```

---

## 八、中断配置标准库函数

### 8.1 常用函数一览

| 函数 | 说明 |
|------|------|
| NVIC_PriorityGroupConfig() | 配置优先级分组 |
| NVIC_Init() | 初始化NVIC |
| NVIC_SetPriority() | 设置中断优先级 |
| NVIC_EnableIRQ() | 使能中断通道 |
| NVIC_DisableIRQ() | 禁能中断通道 |
| EXTI_Init() | 初始化EXTI |
| EXTI_GetITStatus() | 获取中断状态 |
| EXTI_ClearITPendingBit() | 清除中断标志 |
| GPIO_EXTILineConfig() | 配置EXTI线 |

### 8.2 NVIC_InitTypeDef 结构体

```c
typedef struct {
    uint8_t NVIC_IRQChannel;                      // 中断通道
    uint8_t NVIC_IRQChannelPreemptionPriority;    // 抢占优先级
    uint8_t NVIC_IRQChannelSubPriority;           // 响应优先级
    FunctionalState NVIC_IRQChannelCmd;           // 使能/禁能
} NVIC_InitTypeDef;
```

### 8.3 EXTI_InitTypeDef 结构体

```c
typedef struct {
    uint32_t EXTI_Line;      // 中断线：EXTI_Line0~EXTI_Line15
    EXTIMode_TypeDef EXTI_Mode;      // 模式：中断/事件
    EXTITrigger_TypeDef EXTI_Trigger;  // 触发：上升/下降/双边
    FunctionalState EXTI_LineCmd;    // 使能/禁能
} EXTI_InitTypeDef;
```

---

## 九、中断处理最佳实践

### 9.1 ISR 编写原则

1. **快进快出**：ISR 执行时间尽可能短
2. **不使用阻塞函数**：不要在 ISR 中使用 delay、printf 等阻塞操作
3. **使用volatile变量**：中断与主程序共享的数据要用 volatile
4. **清除中断标志**：处理完中断后要及时清除标志位
5. **避免重入**：不要在 ISR 中调用其他可能产生相同中断的函数

### 9.2 错误示例与纠正

**错误示例：ISR 中使用 delay**
```c
void EXTI0_IRQHandler(void) {
    delay_ms(100);  // 错误！delay 依赖定时器，可能导致死锁
    EXTI_ClearITPendingBit(EXTI_Line0);
}
```

**正确做法：使用标志位**
```c
volatile uint8_t exti0_flag = 0;

void EXTI0_IRQHandler(void) {
    exti0_flag = 1;  // 只设置标志位
    EXTI_ClearITPendingBit(EXTI_Line0);
}

int main(void) {
    while (1) {
        if (exti0_flag) {
            exti0_flag = 0;
            delay_ms(100);  // 在主循环中处理耗时操作
        }
    }
}
```

### 9.3 共享数据保护

```c
volatile uint32_t shared_counter = 0;

// 中断中修改
void TIM2_IRQHandler(void) {
    shared_counter++;
    TIM_ClearITPendingBit(TIM2, TIM_IT_Update);
}

// 主循环读取
int main(void) {
    while (1) {
        uint32_t count;
        __disable_irq();         // 禁用中断
        count = shared_counter;  // 安全读取
        __enable_irq();          // 恢复中断
        
        printf("Count: %d\r\n", count);
        delay_ms(1000);
    }
}
```

### 9.4 中断优先级反转问题

**问题**：低优先级中断阻塞高优先级中断

**解决**：
- 合理分配优先级
- 使用优先级分组
- 避免在低优先级 ISR 中执行长时间操作

---

## 十、总结

| 知识点 | 重点内容 |
|--------|----------|
| 中断机制 | 暂停主任务，执行 ISR，响应外部事件 |
| NVIC | 管理所有外设中断，支持优先级嵌套 |
| 优先级 | 抢占优先级可打断，响应优先级只在同抢占级比较 |
| EXTI | 外部中断控制器，响应 GPIO 引脚电平变化 |
| 配置步骤 | 使能时钟 → 配置GPIO → 连接EXTI → 配置NVIC → 编写ISR |
| 最佳实践 | 快进快出、volatile 变量、标志位传递 |

