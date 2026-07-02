---
sidebar_position: 11
title: 串口 / 按键 / 看门狗 / RTC（HAL 库）
---

> 课程系列：第5季 STM32 CubeMX与HAL库详解 · 章节：5.4  
> 目标芯片：STM32L476RGTx | 开发环境：STM32CubeMX + Keil MDK

---

## 目录

1. [串口（USART/LPUART）操作](#1-串口操作)
2. [按键与外部中断](#2-按键与外部中断)
3. [独立看门狗与窗口看门狗](#3-看门狗)
4. [RTC 实时时钟](#4-rtc-实时时钟)

---

## 1. 串口操作

### 1.1 CubeMX 中配置串口

在 CubeMX 的 Connectivity 分类中选择 USART1，将模式设为 **Asynchronous**（异步模式），设置波特率为 115200，数据位 8，停止位 1，无奇偶校验。  
若需同时使用低功耗串口（连接 NB-IoT 模块），则同样配置 **LPUART1**，波特率设为 9600。

CubeMX 自动生成的引脚分配：

| 串口    | TX 引脚 | RX 引脚 |
|---------|---------|---------|
| USART1  | PA9     | PA10    |
| LPUART1 | PB11    | PB10    |

> ⚠️ 注意：CubeMX 自动分配的 LPUART IO 口可能不正确，需手工核对原理图后调整。

---

### 1.2 阻塞式串口收发

**原理**：CPU 一个字节一个字节地将数据丢给串口模块，等待串口发完再继续。效率低但编程简单，实际应用中使用频率较高。

#### 核心 HAL 库函数

```c
// 阻塞式发送
HAL_StatusTypeDef HAL_UART_Transmit(UART_HandleTypeDef *huart,
                                     uint8_t *pData,
                                     uint16_t Size,
                                     uint32_t Timeout);

// 阻塞式接收
HAL_StatusTypeDef HAL_UART_Receive(UART_HandleTypeDef *huart,
                                    uint8_t *pData,
                                    uint16_t Size,
                                    uint32_t Timeout);
```

#### 发送示例

```c
uint8_t sbuf[20] = "stm32";
HAL_UART_Transmit(&huart1, sbuf, 5, 0x0001FFFF);
HAL_Delay(1000);
```

#### 接收示例（回显）

```c
uint8_t rbuf[1] = {0};
HAL_UART_Receive(&huart1, rbuf, 1, 0x0000FFFF);
HAL_UART_Transmit(&huart1, rbuf, 1, 0x0001FFFF);
```

**总结**：阻塞式发送实际使用很多，编程简单；缺陷是浪费 CPU 性能，无法达到串口与系统整体性能最优。

---

### 1.3 非阻塞（中断）式串口发送

**原理**：CPU 向串口模块丢一个字节后立刻跳出去做其他事；串口模块发完这个字节后产生中断通知 CPU 继续丢下一个字节，直到全部发完。

#### 核心函数

```c
// 中断式发送（非阻塞）
HAL_StatusTypeDef HAL_UART_Transmit_IT(UART_HandleTypeDef *huart,
                                        uint8_t *pData,
                                        uint16_t Size);

// 中断式接收（非阻塞）
HAL_StatusTypeDef HAL_UART_Receive_IT(UART_HandleTypeDef *huart,
                                       uint8_t *pData,
                                       uint16_t Size);
```

#### 发送示例

```c
uint8_t sbuf[20] = "stm32";
HAL_UART_Transmit_IT(&huart1, sbuf, 5);
HAL_Delay(1000);
```

---

### 1.4 重定向 printf

将标准库 `printf` 的底层输出重定向到 USART1，需在 `usart.c` 中添加如下代码：

```c
#include "stdio.h"

#ifdef __GNUC__
    #define PUTCHAR_PROTOTYPE int __io_putchar(int ch)
#else
    #define PUTCHAR_PROTOTYPE int fputc(int ch, FILE *f)
#endif

PUTCHAR_PROTOTYPE
{
    HAL_UART_Transmit(&huart1, (uint8_t *)&ch, 1, 0xFFFF);
    return ch;
}
```

> MDK（ARMCC）使用 `fputc`，GCC 编译器使用 `__io_putchar`，通过宏自动适配。  
> 使用前需在 MDK 的 Target Options → Target 中勾选 **Use MicroLIB**。

使用示例：

```c
printf("Hello STM32!\r\n");
float a = 4.35;
printf("a = %.2f\r\n", a);
```

---

### 1.5 中断式接收示例

#### 启动中断接收

在初始化完成后，调用一次 `HAL_UART_Receive_IT` 挂起中断接收：

```c
uint8_t rc;   // 接收缓冲字节
HAL_UART_Receive_IT(&huart1, &rc, 1);
```

#### 接收完成回调

每接收到 1 字节后，HAL 库自动调用 `HAL_UART_RxCpltCallback`，在此处理数据并重新挂起下一次接收：

```c
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1)
    {
        // 将接收到的字节原封不动发回（回显）
        HAL_UART_Transmit(&huart1, &rc, 1, 0xFF);
        // 重新挂起下一次中断接收
        while (HAL_UART_Receive_IT(&huart1, &rc, 1) != HAL_OK);
    }
}
```

> **注意**：`HAL_UART_RxCpltCallback` 运行在中断上下文中，应尽量简短，避免阻塞操作。

---

### 1.6 任意字节接收与命令 Shell

#### 设计目标

实现一个基于中断式串口接收的**自定义协议命令 Shell**：

- 指令集：`add`、`sub`
- 指令结束符：回车换行 `\r\n`

#### 关键变量

```c
uint8_t rc;             // 接收单字节暂存
uint8_t rev_buf[20];    // 命令接收缓冲区
uint8_t ind = 0;        // 缓冲区当前写入索引
```

#### 中断回调中积累字节

```c
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1)
    {
        rev_buf[ind++] = rc;   // 将本次字节存入 buf
        while (HAL_UART_Receive_IT(&huart1, &rc, 1) != HAL_OK);
    }
}
```

#### 主循环中解析执行

```c
for (uint8_t i = 0; i < ind; i++)
{
    if ((rev_buf[i] == '\r') && (rev_buf[i+1] == '\n'))
    {
        if (strncmp((char*)rev_buf, "add\r\n", 5) == 0)
        {
            // 执行 add 指令
        }
        else if (strncmp((char*)rev_buf, "sub\r\n", 5) == 0)
        {
            // 执行 sub 指令
        }
        else
        {
            HAL_UART_Transmit(&huart1, (uint8_t*)"unknown\r\n", 9, 0xFF);
        }
        memset(rev_buf, 0, 20);
        ind = 0;
    }
}
```

---

### 1.7 对接 NB-IoT 模块（AT 指令）

#### 硬件接线

```
NB模块 TX/RX  <--->  STM32 LPUART1（PB10/PB11）
PC USB转串口  <--->  STM32 USART1（PA9/PA10）
```

#### LPUART1 初始化（CubeMX 自动生成）

```c
hlpuart1.Instance        = LPUART1;
hlpuart1.Init.BaudRate   = 9600;
hlpuart1.Init.WordLength = UART_WORDLENGTH_8B;
hlpuart1.Init.StopBits   = UART_STOPBITS_1;
hlpuart1.Init.Parity     = UART_PARITY_NONE;
hlpuart1.Init.Mode       = UART_MODE_TX_RX;
HAL_UART_Init(&hlpuart1);
```

#### 功能实现：PC→NB模块透传

```c
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1)
    {
        rev_buf[ind++] = rc;
        while (HAL_UART_Receive_IT(&huart1, &rc, 1) != HAL_OK);
    }
    if (huart->Instance == LPUART1)
    {
        HAL_UART_Transmit(&huart1, &rc, 1, 0xFF);  // NB模块→PC
        while (HAL_UART_Receive_IT(&hlpuart1, &rc, 1) != HAL_OK);
    }
}

// 主循环中：检测到完整命令后转发给 NB 模块
HAL_UART_Transmit(&hlpuart1, rev_buf, strlen((char*)rev_buf), 0x0001FFFF);
memset(rev_buf, 0, 20);
ind = 0;
```

---

### 1.8 串口编程总结

- 基于 HAL 库和 CubeMX 的串口开发使用起来非常简洁，核心 API 只有几个。
- 遇到问题大多是因为对工具链不熟悉（IO 分配、时钟配置等），这类问题最耗调试时间。
- 解决问题的根本在于**调试能力和经验积累**，是核心竞争力。
- **未尽事宜**：DMA 方式的串口发送与接收（效率更高）、FIFO 打开与关闭的行为差异。

---
## 2. 按键与外部中断

### 2.1 概念

STM32 的**外部中断（EXTI）**允许 GPIO 引脚的电平变化触发 CPU 中断，无需在主循环中反复轮询按键状态，CPU 可以在其他任务上高效运行。

STM32L4 共有 16 条外部中断线（EXTI0~EXTI15），每条线对应各 GPIO 端口的同号引脚（PA0、PB0、PC0 共享 EXTI0，以此类推）。

### 2.2 CubeMX 配置

1. 在 Pinout → GPIO 中选择按键引脚（本例 SW1 → PC0）。
2. 模式设为 `GPIO_MODE_IT_FALLING`（下降沿触发，按下产生低电平）。
3. Pull 设为 `GPIO_PULLUP`（内部上拉，按键未按时引脚保持高电平）。
4. 在 NVIC Settings 中使能 `EXTI0 interrupt`，设置抢占优先级。

CubeMX 自动生成的初始化代码（`gpio.c`）：

```c
// SW1 按键：下降沿中断 + 内部上拉
GPIO_InitStruct.Pin   = SW1_Pin;
GPIO_InitStruct.Mode  = GPIO_MODE_IT_FALLING;
GPIO_InitStruct.Pull  = GPIO_PULLUP;
HAL_GPIO_Init(SW1_GPIO_Port, &GPIO_InitStruct);

// 使能 EXTI0 中断，优先级 0
HAL_NVIC_SetPriority(EXTI0_IRQn, 0, 0);
HAL_NVIC_EnableIRQ(EXTI0_IRQn);
```

### 2.3 中断调用链

HAL 库的外部中断处理分三层，用户只需重写最底层的回调：

```
EXTI0_IRQHandler()                     ← stm32l4xx_it.c（CubeMX 自动生成，无需改动）
    └─ HAL_GPIO_EXTI_IRQHandler()      ← HAL 库内部，负责清除中断标志
           └─ HAL_GPIO_EXTI_Callback() ← 弱定义，用户在 main.c 中重写业务逻辑
```

`stm32l4xx_it.c` 入口（自动生成）：

```c
void EXTI0_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_0);
}
```

### 2.4 用户回调实现

在 `main.c` 中重写弱函数，实现业务逻辑（本例：按键切换 LED 亮灭）：

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == SW1_Pin)
    {
        HAL_GPIO_TogglePin(USR_LED_GPIO_Port, USR_LED_Pin);
    }
}
```

> ⚠️ 回调运行在中断上下文，不能调用 `HAL_Delay` 等阻塞函数。若需复杂处理，在回调中置标志位，在主循环中执行。

---
## 3. 看门狗

### 3.1 什么是看门狗

看门狗的本质是一个**递减定时器**：程序在规定时间内必须向看门狗写入特定值（"喂狗"）重置计数器；若程序跑飞或卡死导致超时，看门狗自动触发**系统复位**，保证系统恢复正常。

STM32 提供两种看门狗：

| 特性 | 独立看门狗（IWDG） | 窗口看门狗（WWDG） |
|------|------|------|
| 时钟来源 | 独立 LSI（约 32 kHz），不受主时钟影响 | APB1 时钟 |
| 喂狗时机 | 超时前任意时刻皆可 | 必须在**窗口期**内喂狗（早了或晚了都复位）|
| 适用场景 | 防止程序长时间死锁 | 检测程序时序异常（过快/过慢均报错）|
| 低功耗模式 | 可配置在 Stop 模式下继续/暂停 | Stop 模式下可配置 |

### 3.2 独立看门狗（IWDG）

#### 关键寄存器

- **IWDG_KR**：写 `0xCCCC` 启动，写 `0xAAAA` 喂狗，写 `0x5555` 解除 PR/RLR 写保护
- **IWDG_PR**：预分频寄存器，设置 LSI 分频系数（4/8/16/32/64/128/256）
- **IWDG_RLR**：12 位重载值（0~4095）

超时时间公式：

```
T = (Prescaler × Reload) / f_LSI
# 例：Prescaler=64，Reload=625，f_LSI≈32000 Hz → T ≈ 1.25 s
```

#### HAL 库函数

```c
HAL_IWDG_Init(IWDG_HandleTypeDef *hiwdg);    // 初始化并启动（CubeMX 调用）
HAL_IWDG_Refresh(IWDG_HandleTypeDef *hiwdg); // 喂狗（超时前须定期调用）
```

#### 典型用法

```c
// CubeMX 自动生成的初始化
hiwdg.Instance       = IWDG;
hiwdg.Init.Prescaler = IWDG_PRESCALER_64;
hiwdg.Init.Reload    = 625;           // 超时约 1.25 s
HAL_IWDG_Init(&hiwdg);

// 主循环中定期喂狗
while (1)
{
    HAL_IWDG_Refresh(&hiwdg);
    // 业务逻辑...
    HAL_Delay(500);
}
```

### 3.3 窗口看门狗（WWDG）

窗口看门狗要求喂狗**必须在窗口期内**进行：

- 计数器 > 上窗口值（Window）：喂狗太早 → 复位
- 计数器 ≤ 0x3F（下窗口）：喂狗太晚（超时）→ 复位
- 只有计数器在 `(0x3F, Window]` 范围内喂狗才合法

```c
hwwdg.Instance       = WWDG;
hwwdg.Init.Prescaler = WWDG_PRESCALER_8;
hwwdg.Init.Window    = 0x50;   // 上窗口值
hwwdg.Init.Counter   = 0x7F;   // 初始计数值（必须 > Window）
hwwdg.Init.EWIMode   = WWDG_EWI_DISABLE;
HAL_WWDG_Init(&hwwdg);

// 在窗口期内喂狗
HAL_WWDG_Refresh(&hwwdg);
```

---
## 4. RTC 实时时钟

### 4.1 STM32 RTC 功能概述

STM32L476 内置的 RTC（Real Time Clock）是一个独立运行的低功耗日历时钟模块，即使主系统进入睡眠/停止模式也能继续计时，并通过备份电源（VBAT）在系统断电后保持运行。

RTC 主要功能包括：日历（年月日时分秒、星期）、Alarm 闹钟、周期性唤醒、时间戳、入侵检测（Tamper）、精细校准。

### 4.2 RTC 模块框图要点

```
LSE(32.768kHz) 或 LSI/HSE
    │
    ▼
预分频器（AsynchPrediv × SynchPrediv）
    │
    ▼
  日历计数器（秒/分/时/日/月/年/星期）
    │
    ├─── Alarm A / Alarm B（闹钟中断）
    ├─── 周期性唤醒定时器（Wake-up Timer）
    ├─── 时间戳（Timestamp）
    └─── 校准时钟输出（RTC_CALIB / RTC_ALARM 引脚）
```

### 4.3 RTC 时钟与预分频器

RTC 推荐使用 **LSE（32.768 kHz）** 作为时钟源，精度最高且功耗最低。

预分频器分两级：
- **AsynchPrediv**（7位，异步预分频）：建议设为 127（即 ÷128）
- **SynchPrediv**（15位，同步预分频）：建议设为 255（即 ÷256）

最终 RTC 时钟 = 32768 / 128 / 256 = **1 Hz**（每秒更新一次日历）

### 4.4 CubeMX 配置 RTC

1. 在 Timers → RTC 中使能 RTC。
2. 时钟源（Clock Source）选 **LSE**（需在 RCC 中先使能 LSE）。
3. 小时格式选 **24 Hour**（24小时制）。
4. 若需要闹钟中断，在 Alarm A/B 选项卡中配置，并在 NVIC Settings 中使能 `RTC Alarm interrupt`。

CubeMX 自动生成的时钟配置（`main.c` 中 `SystemClock_Config`）：

```c
// 使能 LSE 和 MSI 振荡器
RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_LSE | RCC_OSCILLATORTYPE_MSI;
RCC_OscInitStruct.LSEState       = RCC_LSE_ON;
// 将 RTC 时钟源配置为 LSE
PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_RTC;
PeriphClkInit.RTCClockSelection    = RCC_RTCCLKSOURCE_LSE;
HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit);
```

### 4.5 RTC 初始化代码（`rtc.c`）

CubeMX 自动生成的 `MX_RTC_Init()`，完成时间、日期和闹钟的初始化：

```c
void MX_RTC_Init(void)
{
    RTC_TimeTypeDef sTime = {0};
    RTC_DateTypeDef sDate = {0};
    RTC_AlarmTypeDef sAlarm = {0};

    hrtc.Instance            = RTC;
    hrtc.Init.HourFormat     = RTC_HOURFORMAT_24;
    hrtc.Init.AsynchPrediv   = 127;
    hrtc.Init.SynchPrediv    = 255;
    hrtc.Init.OutPut         = RTC_OUTPUT_DISABLE;
    HAL_RTC_Init(&hrtc);

    // 设置初始时间：00:00:00
    sTime.Hours = 0x0; sTime.Minutes = 0x0; sTime.Seconds = 0x0;
    sTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
    sTime.StoreOperation = RTC_STOREOPERATION_RESET;
    HAL_RTC_SetTime(&hrtc, &sTime, RTC_FORMAT_BCD);

    // 设置初始日期：2000/01/01 周一
    sDate.WeekDay = RTC_WEEKDAY_MONDAY;
    sDate.Month   = RTC_MONTH_JANUARY;
    sDate.Date    = 0x1;
    sDate.Year    = 0x0;
    HAL_RTC_SetDate(&hrtc, &sDate, RTC_FORMAT_BCD);

    // 配置 Alarm A：每小时第 13 分触发（忽略小时匹配）
    sAlarm.AlarmTime.Hours   = 0x0;
    sAlarm.AlarmTime.Minutes = 0x13;
    sAlarm.AlarmTime.Seconds = 0x0;
    sAlarm.AlarmMask         = RTC_ALARMMASK_HOURS;
    sAlarm.Alarm             = RTC_ALARM_A;
    HAL_RTC_SetAlarm_IT(&hrtc, &sAlarm, RTC_FORMAT_BCD);
}
```

> **注意**：`RTC_FORMAT_BCD` 表示参数使用 BCD 编码（如 0x13 表示 13 分），也可使用 `RTC_FORMAT_BIN` 传入普通十进制整数。

### 4.6 读取时间与日期

```c
RTC_TimeTypeDef sTime;
RTC_DateTypeDef sDate;

// 必须先读时间，再读日期（解锁影子寄存器锁存器）
HAL_RTC_GetTime(&hrtc, &sTime, RTC_FORMAT_BIN);
HAL_RTC_GetDate(&hrtc, &sDate, RTC_FORMAT_BIN);

printf("20%02d-%02d-%02d %02d:%02d:%02d\r\n",
    sDate.Year, sDate.Month, sDate.Date,
    sTime.Hours, sTime.Minutes, sTime.Seconds);
```

> ⚠️ HAL 库要求先调用 `HAL_RTC_GetTime` 再调用 `HAL_RTC_GetDate`，否则日期值不会更新（影子寄存器锁定机制）。

### 4.7 Alarm 闹钟中断

Alarm 触发后，HAL 库调用 `HAL_RTC_AlarmAEventCallback`：

```c
void HAL_RTC_AlarmAEventCallback(RTC_HandleTypeDef *hrtc)
{
    printf("Alarm A triggered!\r\n");
}
```

### 4.8 RTC 数据手册关键知识点

以下内容来自 STM32L476 User Manual（RM0351）的 RTC 章节：

**时钟源选择**：LSE（32.768 kHz 晶振，精度最高）、LSI（~32 kHz RC，免外部晶振但精度较低）、HSE/32。

**RTC 复位**：RTC 备份域只被 NRST 或备份域专用复位清零，系统复位不影响 RTC 计时。

**远端精确同步**：RTC 支持通过 `RTC_SHIFTR` 寄存器进行亚秒级时间调整，可与 NTP/GPS 等时源同步。

**时间戳功能**：特定引脚（RTC_TS）上的边沿跳变可触发时间戳，将当前时间锁存到时间戳寄存器，用于事件记录。

**入侵（Tamper）检测**：检测到引脚上的异常信号时，自动清除 RTC 备份寄存器内容，用于防拆机保护。

**对低功耗模式的影响**：RTC 在 Stop、Standby 和 Shutdown 模式下均可保持运行（需 VBAT 供电），并可通过 Alarm 或周期性唤醒唤醒系统。

### 4.9 核心 HAL 库函数汇总

| 函数 | 说明 |
|------|------|
| `HAL_RTC_Init` | 初始化 RTC 模块 |
| `HAL_RTC_SetTime` / `HAL_RTC_GetTime` | 设置/读取时间 |
| `HAL_RTC_SetDate` / `HAL_RTC_GetDate` | 设置/读取日期 |
| `HAL_RTC_SetAlarm_IT` | 配置并使能闹钟中断 |
| `HAL_RTC_DeactivateAlarm` | 禁用闹钟 |
| `HAL_RTCEx_SetWakeUpTimer_IT` | 配置周期性唤醒中断 |

---

## 5. 小结

本阶段学习涵盖了 STM32 HAL 库中四个常用外设的开发方法：

**串口（UART/LPUART）** 方面，掌握了阻塞式与中断式的收发原理和代码实现，重定向了标准库 `printf`，并通过两个实战案例（命令 Shell 和 NB-IoT AT 透传）理解了中断缓冲区设计的核心思路。

**按键与外部中断** 方面，理解了 EXTI 的三层调用链（IRQ Handler → HAL 内部处理 → 用户回调），掌握了 CubeMX 配置和 `HAL_GPIO_EXTI_Callback` 的重写方法。

**看门狗** 方面，区分了独立看门狗（IWDG，任意时刻喂狗）和窗口看门狗（WWDG，窗口期内喂狗）的工作原理和适用场景，掌握了 HAL 库的喂狗接口。

**RTC** 方面，深入阅读了 STM32L476 数据手册的 RTC 章节，理解了预分频器配置、日历读写规则（必须先读时间再读日期）、Alarm 中断机制，以及 RTC 在低功耗模式下的行为。

> 📝 芯片：STM32L476RGTx | 开发工具：STM32CubeMX + Keil MDK | 日期：2026-07-02
