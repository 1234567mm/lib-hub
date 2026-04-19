# STM32 RCC 模块标准库全解析（三）

> 参考资料：STM32F10x Reference Manual、STM32F10x Standard Peripheral Library Source Code
> 适用芯片：STM32F103 系列
> 笔记目标：理解 RCC 标准库函数的内部实现逻辑，能够自信地配置系统时钟

---

## 目录

1. [寄存器位带（Bit-Band）访问](#1-寄存器位带bit-band访问)
2. [mask 掩码与 reset 操作](#2-mask-掩码与-reset-操作)
3. [断言机制 assert](#3-断言机制-assert)
4. [RCC_DeInit()](#4-rcc_deinit)
5. [RCC_HSEConfig()](#5-rcc_hseconfig)
6. [RCC_WaitForHSEStartUp()](#6-rcc_waitforhsestartup)
7. [RCC_AdjustHSICalibrationValue()](#7-rcc_adjusthsicalibrationvalue)
8. [RCC_HSICmd()](#8-rcc_hsicmd)
9. [RCC_PLLConfig()](#9-rcc_pllconfig)
10. [RCC_SYSCLKConfig()](#10-rcc_sysclkconfig)

---

## 1. 寄存器位带（Bit-Band）访问

### 什么是位带访问？

Cortex-M3 提供了一种**把寄存器的每一个 bit 映射到一个独立的 32-bit 地址**的机制，叫做 **Bit-Band（位带）**。

- 普通写法：读-改-写，**3 步**，存在被中断打断的风险
- 位带写法：直接对单个 bit 的地址写 0 或 1，**原子操作**，1 步完成

### 两个位带区域

| 区域 | 原始地址范围 | 位带别名地址范围 |
|------|------------|----------------|
| SRAM | `0x2000_0000` ~ `0x200F_FFFF`（1MB） | `0x2200_0000` ~ `0x23FF_FFFF`（32MB） |
| 外设 | `0x4000_0000` ~ `0x400F_FFFF`（1MB） | `0x4200_0000` ~ `0x43FF_FFFF`（32MB） |

### 位带地址计算公式

```
别名地址 = 基地址 + (字节偏移 × 32) + (位号 × 4)
```

**示例**：操作 RCC_CR 寄存器（地址 `0x4002_1000`）的第 0 位（HSION）：

```
字节偏移 = 0x40021000 - 0x40000000 = 0x21000
别名地址 = 0x42000000 + (0x21000 × 32) + (0 × 4)
         = 0x42000000 + 0x420000 + 0
         = 0x42420000
```

直接对 `0x42420000` 写 1 → HSION 置 1（打开 HSI）

### 库中如何使用？

STM32 标准库大量使用的是**普通掩码写法**，位带访问更多出现在对性能要求极高或对原子性要求严格的场合（如 GPIO 操作）。了解位带机制有助于理解底层。

---

## 2. mask 掩码与 reset 操作

### 掩码是什么？

掩码（mask）就是一个**二进制模板**，配合与（`&`）、或（`|`）、异或（`^`）操作，精准修改寄存器中的特定位，而不影响其他位。

### 三种常见操作

```c
// ① 置位（set）：把某些位强制设为 1，其他位不变
REG |= MASK;

// ② 清零（clear / reset）：把某些位强制设为 0，其他位不变
REG &= ~MASK;

// ③ 先清后写（read-modify-write）：修改某个字段为特定值
REG = (REG & ~FIELD_MASK) | (VALUE << FIELD_POS);
```

### 实际例子：操作 RCC_CFGR 的 SW 字段（系统时钟源选择，bit[1:0]）

```c
#define RCC_CFGR_SW_Mask   ((uint32_t)0xFFFFFFFC)  // 末两位清零掩码
// ~0xFFFFFFFC = 0x00000003 → 只保留 bit[1:0]

// 第一步：读出当前 CFGR，把 SW 字段清零
uint32_t tmpreg = RCC->CFGR & RCC_CFGR_SW_Mask;

// 第二步：填入新的时钟源选择值（如 0x02 = PLL）
tmpreg |= RCC_SYSCLKSource_PLLCLK;  // 0x00000002

// 第三步：写回
RCC->CFGR = tmpreg;
```

> **记忆口诀**：`& ~MASK` 清字段，`| VALUE` 写字段，两步合一次写回。

### reset 操作

在 `RCC_DeInit()` 中大量出现直接赋值，将寄存器恢复到复位默认值：

```c
RCC->CR |= (uint32_t)0x00000001;   // 先确保 HSION = 1（内部 HSI 开启）
RCC->CFGR = 0x00000000;            // 系统时钟切回 HSI，所有分频器归默认
RCC->CR &= (uint32_t)0xFEF6FFFF;  // 清除 HSEON、CSSON、PLLON（保留其他位）
```

---

## 3. 断言机制 assert

### assert 是什么？

`assert`（断言）是 C 语言中用于**参数合法性检查**的机制。

- **断言为真（参数合法）**：什么都不做，程序继续执行
- **断言为假（参数非法）**：触发报错，提示开发者去修改

### 在 STM32 标准库中的形式

库函数中使用的是 **`assert_param(expr)`**，定义在 `stm32f10x_conf.h`：

```c
/* 使能断言时 */
#define assert_param(expr)  ((expr) ? (void)0 : assert_failed((uint8_t *)__FILE__, __LINE__))

/* 关闭断言时（发布版本，节省代码空间） */
#define assert_param(expr)  ((void)0)
```

### assert_failed() 需要自己实现

`assert_failed()` 只有声明，**函数体需要用户在 `main.c` 或专用文件中自己写**：

```c
void assert_failed(uint8_t* file, uint32_t line)
{
    /* 方式一：死循环，配合调试器查看 file 和 line 变量 */
    while (1) { }

    /* 方式二：串口打印（推荐调试阶段使用） */
    printf("Assert failed: file %s on line %d\r\n", file, line);
    while (1) { }
}
```

### 库函数中 assert_param 的典型用法

```c
void RCC_HSEConfig(uint32_t RCC_HSE)
{
    /* 断言检查传入参数是否是合法值之一 */
    assert_param(IS_RCC_HSE(RCC_HSE));
    // IS_RCC_HSE 是一个宏，检查参数是否等于 OFF / ON / Bypass 三者之一
    ...
}
```

> **学习要点**：看到 `IS_RCC_XXX(param)` 这类宏，去头文件里找定义，就知道该函数接受哪些合法参数值。

---

## 4. RCC_DeInit()

### 功能

将 RCC 所有相关寄存器**恢复到复位（上电）默认状态**。常用于重新初始化时钟系统之前的"清场"操作。

### 源码逻辑（逐步解析）

```c
void RCC_DeInit(void)
{
    /* 步骤1：开启 HSI（内部 8MHz RC 振荡器） */
    RCC->CR |= (uint32_t)0x00000001;   // HSION = 1

    /* 步骤2：CFGR 清零
       - SW[1:0] = 00 → 系统时钟源切回 HSI
       - HPRE / PPRE1 / PPRE2 / ADCPRE 全部清零（不分频）
       - MCO = 000（不输出时钟） */
    RCC->CFGR = (uint32_t)0x00000000;

    /* 步骤3：CR 中关闭 HSEON、CSSON、PLLON
       0xFEF6FFFF 的反码 = 0x01090000，即清除 bit24(PLLON) bit19(CSSON) bit16(HSEON) */
    RCC->CR &= (uint32_t)0xFEF6FFFF;

    /* 步骤4：CFGR 中清除 PLLSRC / PLLXTPRE / PLLMUL / USBPRE */
    RCC->CFGR &= (uint32_t)0xFF80FFFF;

    /* 步骤5：关闭 HSE 旁路（HSEBYP = 0） */
    RCC->CR &= (uint32_t)0xFFFBFFFF;

    /* 步骤6：清除所有时钟中断使能和中断标志 */
    RCC->CIR = 0x009F0000;
}
```

### 执行后的系统状态

| 项目 | 状态 |
|------|------|
| 系统时钟源 | HSI（8 MHz） |
| AHB/APB 分频 | 不分频（×1） |
| HSE | 关闭 |
| PLL | 关闭 |
| CSS | 关闭 |

---

## 5. RCC_HSEConfig()

### 功能

配置外部高速时钟（HSE）的工作模式。

### 函数原型

```c
void RCC_HSEConfig(uint32_t RCC_HSE);
```

### 参数取值（三选一）

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_HSE_OFF` | `0x00000000` | 关闭 HSE |
| `RCC_HSE_ON` | `0x00010000` | 开启 HSE（使用外部晶振） |
| `RCC_HSE_Bypass` | `0x00040000` | 旁路模式（使用外部时钟信号，非晶振） |

### 源码核心逻辑

```c
void RCC_HSEConfig(uint32_t RCC_HSE)
{
    assert_param(IS_RCC_HSE(RCC_HSE));

    /* 必须先把 HSEON 和 HSEBYP 都清零，再写入新值 */
    /* 原因：不能从 ON 直接切换到 Bypass，必须先 OFF */
    RCC->CR &= CR_HSEON_Reset;    // 清除 HSEON（bit16）
    RCC->CR &= CR_HSEBYP_Reset;  // 清除 HSEBYP（bit18）

    /* 根据参数设置 */
    switch(RCC_HSE)
    {
        case RCC_HSE_ON:
            RCC->CR |= CR_HSEON_Set;    // 只置 HSEON
            break;
        case RCC_HSE_Bypass:
            RCC->CR |= CR_HSEBYP_Set | CR_HSEON_Set;  // 先置 HSEBYP 再置 HSEON
            break;
        default:  // RCC_HSE_OFF：不做任何置位操作，已在上面清零
            break;
    }
}
```

### ⚠️ 注意事项

1. **HSE 在被用作系统时钟时不能被关闭**，否则系统会崩溃
2. **切换 ON ↔ Bypass 必须经过 OFF**，库函数已帮你处理了这一点
3. 开启 HSE 后要配合 `RCC_WaitForHSEStartUp()` 等待稳定

---

## 6. RCC_WaitForHSEStartUp()

### 功能

等待 HSE 振荡器稳定（HSERDY 标志置位），带**超时机制**防止死等。

### 函数原型

```c
ErrorStatus RCC_WaitForHSEStartUp(void);
// 返回：SUCCESS 或 ERROR（枚举类型）
```

### 源码逻辑

```c
ErrorStatus RCC_WaitForHSEStartUp(void)
{
    __IO uint32_t StartUpCounter = 0;
    ErrorStatus status = ERROR;
    FlagStatus HSEStatus = RESET;

    do {
        /* 检查 HSERDY 标志（RCC_CR bit17） */
        HSEStatus = RCC_GetFlagStatus(RCC_FLAG_HSERDY);
        StartUpCounter++;
    } while ((StartUpCounter != HSE_STARTUP_TIMEOUT) && (HSEStatus == RESET));
    // HSE_STARTUP_TIMEOUT 默认值：0x0500（在 stm32f10x.h 中定义）

    if (RCC_GetFlagStatus(RCC_FLAG_HSERDY) != RESET)
    {
        status = SUCCESS;
    }
    else
    {
        status = ERROR;  // 超时，HSE 启动失败
    }
    return status;
}
```

### 典型使用模式

```c
RCC_HSEConfig(RCC_HSE_ON);                    // ① 打开 HSE
if (RCC_WaitForHSEStartUp() == SUCCESS)       // ② 等待并判断
{
    // ③ HSE 稳定，继续配置 PLL 等
}
else
{
    // HSE 启动失败，做错误处理（如回退到 HSI）
}
```

> **HSE_STARTUP_TIMEOUT 可以自己调**：如果外部晶振质量较差、起振慢，可适当增大该值。

---

## 7. RCC_AdjustHSICalibrationValue()

### 功能

微调 HSI（内部 8MHz RC 振荡器）的校准值，补偿制造误差和温度漂移。

### 函数原型

```c
void RCC_AdjustHSICalibrationValue(uint8_t HSICalibrationValue);
// 参数范围：0x00 ~ 0x1F（5位，共32个调节档位）
```

### 原理

- HSI 出厂时在 `RCC_CR` 的 `HSICAL[7:0]`（bit15:8）写入了校准值，用户**只读**
- 用户可以通过写 `HSITRIM[4:0]`（bit12:8，共5位）进行±微调
- 每一个档位的调节步长约为 **0.5%** 的频率变化

### 源码核心

```c
void RCC_AdjustHSICalibrationValue(uint8_t HSICalibrationValue)
{
    assert_param(IS_RCC_CALIBRATION_VALUE(HSICalibrationValue));  // 检查 0~31

    uint32_t tmpreg = RCC->CR;
    /* 清除原来的 HSITRIM 字段（bit12:8） */
    tmpreg &= CR_HSITRIM_Mask;
    /* 写入新的校准值（左移8位对齐到 bit12:8） */
    tmpreg |= (uint32_t)HSICalibrationValue << 3;
    RCC->CR = tmpreg;
}
```

> **什么时候用**：一般不需要手动调用，默认值（0x10，即16）已经是出厂校准中心值。只有在精确时序要求下（如 USB 通信、UART 高波特率）才考虑微调。

---

## 8. RCC_HSICmd()

### 功能

使能或禁止 HSI（内部 8MHz 振荡器）。

### 函数原型

```c
void RCC_HSICmd(FunctionalState NewState);
// NewState: ENABLE 或 DISABLE
```

### 源码

```c
void RCC_HSICmd(FunctionalState NewState)
{
    assert_param(IS_FUNCTIONAL_STATE(NewState));
    // 操作 RCC_CR 的 HSION 位（bit0）
    *((__IO uint32_t *) CR_HSION_BB) = (uint32_t)NewState;
    // 这里用的就是位带（Bit-Band）访问！直接写别名地址
}
```

### ⚠️ 注意

- **HSI 正在作为系统时钟时，不能被关闭**
- HSI 也是 PLL 可选的输入源之一（PLL 输入 = HSI/2）
- 系统复位后，HSI 默认是开启的（HSION = 1）

---

## 9. RCC_PLLConfig()

### 功能

配置 PLL 的**时钟源**和**倍频系数**（但不启动 PLL）。

### 函数原型

```c
void RCC_PLLConfig(uint32_t RCC_PLLSource, uint32_t RCC_PLLMul);
```

### 参数说明

**RCC_PLLSource（PLL 输入源）**：

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_PLLSource_HSI_Div2` | `0x00000000` | HSI / 2 = 4 MHz |
| `RCC_PLLSource_HSE_Div1` | `0x00010000` | HSE（不分频） |
| `RCC_PLLSource_HSE_Div2` | `0x00030000` | HSE / 2 |

**RCC_PLLMul（倍频系数）**：

| 宏定义 | 实际倍数 |
|--------|---------|
| `RCC_PLLMul_2` | ×2 |
| `RCC_PLLMul_9` | ×9（最常用：8MHz × 9 = 72MHz） |
| `RCC_PLLMul_16` | ×16（最大） |

### 源码核心

```c
void RCC_PLLConfig(uint32_t RCC_PLLSource, uint32_t RCC_PLLMul)
{
    assert_param(IS_RCC_PLL_SOURCE(RCC_PLLSource));
    assert_param(IS_RCC_PLL_MUL(RCC_PLLMul));

    uint32_t tmpreg = RCC->CFGR;
    /* 清除 PLLSRC / PLLXTPRE / PLLMUL 字段 */
    tmpreg &= CFGR_PLL_Mask;
    /* 写入新值 */
    tmpreg |= RCC_PLLSource | RCC_PLLMul;
    RCC->CFGR = tmpreg;
}
```

### ⚠️ 重要限制

> **PLL 运行时不能修改配置！** 必须先用 `RCC_PLLCmd(DISABLE)` 关闭 PLL，修改完再重新开启。

### 典型 72MHz 配置

```c
// 前提：HSE 8MHz 已稳定
RCC_PLLConfig(RCC_PLLSource_HSE_Div1, RCC_PLLMul_9);  // 8 × 9 = 72MHz
RCC_PLLCmd(ENABLE);
// 等待 PLLRDY
while (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) == RESET);
```

---

## 10. RCC_SYSCLKConfig()

### 功能

选择系统时钟（SYSCLK）的来源。

### 函数原型

```c
void RCC_SYSCLKConfig(uint32_t RCC_SYSCLKSource);
```

### 参数取值（三选一）

| 宏定义 | 值 | 含义 |
|--------|-----|------|
| `RCC_SYSCLKSource_HSI` | `0x00000000` | HSI 作为系统时钟 |
| `RCC_SYSCLKSource_HSE` | `0x00000001` | HSE 作为系统时钟 |
| `RCC_SYSCLKSource_PLLCLK` | `0x00000002` | PLL 输出作为系统时钟 |

### 源码核心

```c
void RCC_SYSCLKConfig(uint32_t RCC_SYSCLKSource)
{
    assert_param(IS_RCC_SYSCLK_SOURCE(RCC_SYSCLKSource));

    uint32_t tmpreg = RCC->CFGR;
    /* 清除 SW[1:0]（bit1:0） */
    tmpreg &= CFGR_SW_Mask;          // CFGR_SW_Mask = 0xFFFFFFFC
    /* 写入新时钟源 */
    tmpreg |= RCC_SYSCLKSource;
    RCC->CFGR = tmpreg;
}
```

### 切换后如何验证？

读取 `RCC_CFGR` 的 **SWS[1:0]（bit3:2）**，这是硬件实际切换完成后的状态反馈：

```c
// 等待系统时钟切换到 PLL
while (RCC_GetSYSCLKSource() != 0x08)
{
    // 0x08 = SWS[1:0] = 10（PLL 已成为系统时钟）
}
```

| SWS 值 | 实际系统时钟 |
|--------|------------|
| `0x00` | HSI |
| `0x04` | HSE |
| `0x08` | PLL |

---

## 综合：标准 72MHz 系统时钟配置流程

```c
void SystemClock_72MHz(void)
{
    /* 1. 复位 RCC 到默认状态（可选，系统已启动时慎用） */
    // RCC_DeInit();

    /* 2. 开启 HSE */
    RCC_HSEConfig(RCC_HSE_ON);

    /* 3. 等待 HSE 稳定 */
    if (RCC_WaitForHSEStartUp() != SUCCESS) {
        // HSE 失败，错误处理
        return;
    }

    /* 4. 配置 Flash 等待周期（72MHz 必须设为 2 个等待周期） */
    FLASH_SetLatency(FLASH_Latency_2);
    FLASH_PrefetchBufferCmd(FLASH_PrefetchBuffer_Enable);

    /* 5. 配置总线分频器 */
    RCC_HCLKConfig(RCC_SYSCLK_Div1);    // AHB  = SYSCLK / 1 = 72MHz
    RCC_PCLK2Config(RCC_HCLK_Div1);    // APB2 = HCLK  / 1 = 72MHz
    RCC_PCLK1Config(RCC_HCLK_Div2);    // APB1 = HCLK  / 2 = 36MHz（最大36MHz）

    /* 6. 配置 PLL：HSE × 9 = 72MHz */
    RCC_PLLConfig(RCC_PLLSource_HSE_Div1, RCC_PLLMul_9);

    /* 7. 开启 PLL */
    RCC_PLLCmd(ENABLE);

    /* 8. 等待 PLL 稳定 */
    while (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) == RESET);

    /* 9. 切换系统时钟到 PLL */
    RCC_SYSCLKConfig(RCC_SYSCLKSource_PLLCLK);

    /* 10. 等待切换完成 */
    while (RCC_GetSYSCLKSource() != 0x08);

    // 系统时钟现在是 72MHz
}
```

---

## 快速回顾卡片

| 函数 | 核心操作 | 关键注意点 |
|------|---------|-----------|
| `RCC_DeInit()` | 所有时钟寄存器回到复位值 | 会切回 HSI，谨慎使用 |
| `RCC_HSEConfig()` | 设置 HSE 的 ON/OFF/Bypass | 切换必须经过 OFF |
| `RCC_WaitForHSEStartUp()` | 轮询 HSERDY，带超时 | 返回 SUCCESS/ERROR |
| `RCC_AdjustHSICalibration()` | 写 HSITRIM 微调 HSI | 默认值 0x10 无需调 |
| `RCC_HSICmd()` | 控制 HSION 位（用位带） | 作系统时钟时不能关 |
| `RCC_PLLConfig()` | 写 PLLSRC + PLLMUL | PLL 运行时不能配置 |
| `RCC_SYSCLKConfig()` | 写 SW[1:0] 切换时钟源 | 写后读 SWS 验证切换 |

---

*笔记版本：v1.0 | 最后更新：2026-04*
