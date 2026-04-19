---
title: ADC 采样与转换
---

ADC（Analog-to-Digital Converter，模数转换器）是嵌入式系统中将模拟信号转换为数字信号的关键外设。STM32F1 集成了 12 位逐次逼近型 ADC，具有高速、高精度、多通道采样等特点。本文档详细介绍 ADC 的工作原理、配置方法和应用实践。

## ADC 原理

### 逐次逼近型 ADC 工作原理

STM32F1 使用逐次逼近型（SAR - Successive Approximation Register）ADC，其工作过程如下：

```
          ┌─────────────────────────────────────────┐
          │           逐次逼近寄存器 (SAR)           │
          │  ┌─────┬─────┬─────┬─────┬─────┬─────┐    │
          │  │ Bit11│ Bit10│ ... │ Bit1│ Bit0│    │
          │  └──┬──┴──┬──┴─────┴──┬──┴──┬──┴─────┘    │
          │     │    │           │    │              │
          │     ▼    ▼           ▼    ▼              │
          │  ┌────────────────────────────┐          │
          │  │     DAC (数模转换器)        │          │
          │  └──────────┬─────────────────┘          │
          │             │                            │
          │             ▼                            │
          │  ┌────────────────────────────┐          │
          │  │   比较器 (Comparator)        │◄────────┼──── 输入电压 VIN
          │  └──────────┬─────────────────┘          │
          │             │                            │
          │             ▼                            │
          │     比较结果输出                         │
          └─────────────┼───────────────────────────┘
                        │
                        ▼
                  逐位确定
```

**工作步骤**（以 12 位 ADC 为例）：

1. **初始化**：SAR 寄存器所有位清零
2. **最高位测试**：将 Bit11 置 1，DAC 输出 Vref/2
3. **比较**：如果 VIN > VDAC，保持 Bit11=1；否则 Bit11=0
4. **次高位测试**：将 Bit10 置 1，重复比较过程
5. **循环**：直到 Bit0 测试完成
6. **完成**：SAR 寄存器的值即为 ADC 转换结果

### 12 位 ADC 的分辨率

STM32F1 的 ADC 是 12 位，分辨率为：

```
LSB = Vref+ / 4096
```

对于 3.3V 参考电压：
- **LSB** = 3.3V / 4096 ≈ 0.806mV
- **量化误差** = ±0.5 LSB ≈ ±0.4mV

| 模拟输入 | ADC 值（二进制） | ADC 值（十进制） |
|----------|------------------|------------------|
| 0V       | 0000 0000 0000   | 0                |
| 0.806mV  | 0000 0000 0001   | 1                |
| 1.612mV  | 0000 0000 0010   | 2                |
| 1.65V    | 0110 0110 0110   | 1638             |
| 3.3V     | 1111 1111 1111   | 4095             |

### ADC 转换时间

ADC 完成一次转换需要的时间包括：

1. **采样时间**（Sample Time）：电容采样输入电压的时间
2. **转换时间**（Conversion Time）：12 位转换需要 12 个时钟周期

**总转换时间公式**：
```
Tconv = 采样时间 + 12 个时钟周期
```

STM32F1 ADC 时钟（ADCCLK）来自 APB2 时钟，最大 14MHz：

| ADCCLK 分频 | ADCCLK 频率 | 采样时间（1.5周期） | 总转换时间 |
|-------------|-------------|---------------------|------------|
| 2           | 36MHz / 2 = 18MHz | 83ns          | 0.75μs     |
| 4           | 36MHz / 4 = 9MHz  | 167ns         | 1.5μs      |
| 6           | 36MHz / 6 = 6MHz  | 250ns         | 2.25μs     |
| 8           | 36MHz / 8 = 4.5MHz| 333ns         | 3μs        |

**采样时间可配置选项**：1.5、7.5、13.5、28.5、41.5、55.5、71.5、239.5 周期

### 采样时间与输入阻抗

采样时间需要足够长，以对输入信号进行充电：

```
采样时间 > (RA + RS) × Csh × ln(4096)
```

其中：
- RA：输入阻抗
- RS：信号源阻抗
- Csh：采样电容（约 8pF）

**建议**：信号源阻抗不应超过 10kΩ，或者增加采样时间

## ADC 通道与序列

### ADC 通道映射

STM32F103 有多个 ADC 通道，分为：

**外部通道（连接到 GPIO）**：
| 通道 | ADC1 | ADC2 | ADC3 |
|------|------|------|------|
| 通道 0 | PA0  | PA0  | PA0  |
| 通道 1 | PA1  | PA1  | PA1  |
| 通道 2 | PA2  | PA2  | PA2  |
| 通道 3 | PA3  | PA3  | PA3  |
| 通道 4 | PA4  | PA4  | PF6  |
| 通道 5 | PA5  | PA5  | PF7  |
| 通道 6 | PA6  | PA6  | PF8  |
| 通道 7 | PA7  | PA7  | PF9  |
| 通道 8 | PB0  | PB0  | PF10 |
| 通道 9 | PB1  | PB1  | PF3  |
| 通道 10 | PC0 | PC0  | PC0  |
| 通道 11 | PC1 | PC1  | PC1  |
| 通道 12 | PC2 | PC2  | PC2  |
| 通道 13 | PC3 | PC3  | PC3  |
| 通道 14 | PC4 | PC4  | -    |
| 通道 15 | PC5 | PC5  | -    |

**内部通道**：
| 通道 | 功能 | 地址 |
|------|------|------|
| 通道 16 | 温度传感器 | - |
| 通道 17 | 内部参考电压 (Vrefint) | 1.2V |
| 通道 18 | VBAT 电压 | VBAT/4 |

### 规则组与注入组

ADC 有两种转换组：

**规则组（Regular Group）**：
- 最常用的转换组
- 最多 16 个通道
- 转换结果存储在一个数据寄存器中
- 适用于连续多通道采样

**注入组（Injected Group）**：
- 优先级高于规则组
- 最多 4 个通道
- 转换结果存储在 4 个独立数据寄存器中
- 适用于中断触发的转换

## ADC 转换模式

### 单次转换模式（Single Conversion）

ADC 完成一个通道的转换后停止：

```c
// 配置为单次转换模式
ADC_InitStructure.ADC_ScanConvMode = DISABLE;   // 关闭扫描模式
ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;  // 关闭连续转换

// 启动转换
ADC_SoftwareStartConvCmd(ADC1, ENABLE);

// 等待转换完成
while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);
uint16_t value = ADC_GetConversionValue(ADC1);
```

### 连续转换模式（Continuous Conversion）

ADC 完成一个通道转换后立即开始下一个转换：

```c
// 配置为连续转换模式
ADC_InitStructure.ADC_ScanConvMode = DISABLE;
ADC_InitStructure.ADC_ContinuousConvMode = ENABLE;  // 开启连续转换

// 启动转换（只需一次）
ADC_SoftwareStartConvCmd(ADC1, ENABLE);

// 后续直接读取数据寄存器即可
uint16_t value = ADC_GetConversionValue(ADC1);
```

### 扫描模式（Scan Mode）

启用扫描模式后，ADC 按顺序转换规则组中的所有通道：

```c
// 配置为扫描模式
ADC_InitStructure.ADC_ScanConvMode = ENABLE;    // 开启扫描
ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;

// 设置规则组通道序列
ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);
ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 2, ADC_SampleTime_55Cycles5);
ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 3, ADC_SampleTime_55Cycles5);

// 启动转换
ADC_SoftwareStartConvCmd(ADC1, ENABLE);

// 等待所有通道转换完成（使用 DMA 时不需要）
while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);
uint16_t values[3];
for (int i = 0; i < 3; i++)
{
    values[i] = ADC_GetConversionValue(ADC1);
}
```

### 间断模式（Discontinuous Mode）

将规则组分成多个子组，每次转换一个子组：

```c
// 配置间断模式，每 2 个通道为一组
ADC_InitStructure.ADC_ScanConvMode = ENABLE;
ADC_InitStructure.ADC_DiscontinuousConvMode = ENABLE;  // 开启间断模式
ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;
ADC_ConfigExternalTrigConv(ADC1, ADC_ExternalTrigConv_None);

// 配置要转换的通道数（每组 2 个）
ADC_SetExternalTrigConv(ADC1, 2);
```

## DMA 模式

ADC 与 DMA 配合使用可以实现高速连续采样，无需 CPU 干预：

### DMA 配置

```c
#define ADC_BUFFER_SIZE  100
uint16_t adc_buffer[ADC_BUFFER_SIZE];

void ADC1_DMA_Config(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // DMA1 Channel 1 用于 ADC1
    DMA_InitStructure.DMA_PeripheralBaseAddr = (uint32_t)&ADC1->DR;
    DMA_InitStructure.DMA_MemoryBaseAddr = (uint32_t)adc_buffer;
    DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;           // 外设作为数据源
    DMA_InitStructure.DMA_BufferSize = ADC_BUFFER_SIZE;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;  // 外设地址不增
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;          // 存储器地址递增
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_HalfWord;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_HalfWord;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;                    // 循环模式
    DMA_InitStructure.DMA_Priority = DMA_Priority_High;
    DMA_InitStructure.DMA_M2M = DMA_M2M_Disable;

    DMA_Init(DMA1_Channel1, &DMA_InitStructure);
    DMA_Cmd(DMA1_Channel1, ENABLE);
}
```

### ADC DMA 模式初始化

```c
void ADC1_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;
    ADC_InitTypeDef ADC_InitStructure;

    // 使能 GPIO 和 ADC 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_ADC1, ENABLE);
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    // 配置 ADC 通道对应的 GPIO
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1 | GPIO_Pin_2;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;  // 模拟输入
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    // ADC 配置
    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;          // 独立模式
    ADC_InitStructure.ADC_ScanConvMode = ENABLE;                // 扫描模式
    ADC_InitStructure.ADC_ContinuousConvMode = ENABLE;           // 连续转换
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;  // 软件触发
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;      // 右对齐
    ADC_InitStructure.ADC_NbrOfChannel = 3;                      // 3 个通道
    ADC_Init(ADC1, &ADC_InitStructure);

    // 配置规则组通道序列
    ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 2, ADC_SampleTime_55Cycles5);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 3, ADC_SampleTime_55Cycles5);

    // 使能 ADC DMA
    ADC_DMACmd(ADC1, ENABLE);

    // 使能 ADC
    ADC_Cmd(ADC1, ENABLE);

    // ADC 校准
    ADC_ResetCalibration(ADC1);
    while (ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while (ADC_GetCalibrationStatus(ADC1));

    // 启动转换
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
}
```

### 读取 DMA 数据

```c
// 在主循环或任务中计算平均值
uint16_t ADC_GetAverage(uint8_t channel)
{
    uint32_t sum = 0;
    for (int i = 0; i < ADC_BUFFER_SIZE; i++)
    {
        // 假设 DMA 缓冲区按顺序存储每个通道的值
        // 即：ch0,ch1,ch2,ch0,ch1,ch2,...
        sum += adc_buffer[i * 3 + channel];
    }
    return sum / (ADC_BUFFER_SIZE / 3);
}
```

## 温度传感器与内部参考电压

### 温度传感器

STM32 内部集成了温度传感器，可以测量芯片温度：

```c
void ADC_TempSensor_Init(void)
{
    // 使能温度传感器
    ADC_TempSensorVrefintCmd(ENABLE);

    // 配置为通道 16
    ADC_RegularChannelConfig(ADC1, ADC_Channel_16, 1, ADC_SampleTime_239Cycles5);

    // 启动转换
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);

    uint16_t temp_raw = ADC_GetConversionValue(ADC1);

    // 计算温度（公式因芯片型号而异，请参考数据手册）
    // 对于 STM32F103：
    // T(°C) = (1.43 - Vtemp) / 0.00425 + 25
}
```

### 内部参考电压

内部参考电压 Vrefint = 1.2V（典型值），用于校准 ADC：

```c
void ADC_Vrefint_Init(void)
{
    // 使能内部参考电压
    ADC_VrefintCmd(ENABLE);

    // 配置为通道 17
    ADC_RegularChannelConfig(ADC1, ADC_Channel_17, 1, ADC_SampleTime_239Cycles5);

    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);

    uint16_t vref_raw = ADC_GetConversionValue(ADC1);

    // 计算实际 VCC
    // VCC = 3.3V × 4096 / vref_raw
}
```

## ADC 寄存器详解

### ADC_CR1 - 控制寄存器 1

| 位 | 名称 | 说明 |
|----|------|------|
| 23 | AWDEN   | 模拟看门狗使能（规则组） |
| 22 | JAWDEN  | 模拟看门狗使能（注入组） |
| 19:16 | DUALMOD[3:0] | 双模式选择 |
| 13 | DISCNUM[2:0] | 间断模式通道数 |
| 12 | JDISCEN | 注入间断模式使能 |
| 11 | DISCEN  | 规则间断模式使能 |
| 8  | JAUTO   | 注入组自动转换 |
| 5  | AWDSGL  | 看门狗单通道模式 |
| 4  | SCAN    | 扫描模式使能 |
| 3  | JEOCIE  | 注入转换完成中断使能 |
| 2  | AWDIE   | 模拟看门狗中断使能 |
| 1  | EOCIE   | 转换结束中断使能 |
| 0  | AWDCH[4:0] | 模拟看门狗通道选择 |

### ADC_CR2 - 控制寄存器 2

| 位 | 名称 | 说明 |
|----|------|------|
| 23 | TSHUT   | 温度传感器关闭 |
| 22 | VREFEN  | 内部参考电压使能 |
| 15 | SWSTART | 起始转换（规则组） |
| 14 | EXTTRIG | 外部触发转换使能 |
| 13:12 | EXTSEL[1:0] | 外部触发选择 |
| 11 | JSWSTART | 起始转换（注入组） |
| 10 | JEXTTRIG | 注入组外部触发使能 |
| 9:8 | JEXTSEL[1:0] | 注入组外部触发选择 |
| 1  | CAL     | 校准启动 |
| 0  | ADON    | ADC 使能 |

### ADC_SR - 状态寄存器

| 位 | 名称 | 说明 |
|----|------|------|
| 4  | STRT    | 规则组转换开始 |
| 3  | JSTRT   | 注入组转换开始 |
| 2  | JEOC    | 注入转换完成 |
| 1  | EOC     | 转换完成 |
| 0  | AWD     | 模拟看门狗事件 |

## 标准库配置模板

### 基础配置

```c
#include "stm32f10x_adc.h"
#include "stm32f10x_rcc.h"
#include "stm32f10x_gpio.h"

void ADC_GPIO_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    // 使能 GPIO 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    // 配置为模拟输入
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0 | GPIO_Pin_1 | GPIO_Pin_2;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
}

void ADC_Mode_Config(void)
{
    ADC_InitTypeDef ADC_InitStructure;

    // 使能 ADC1 时钟
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1, ENABLE);

    // 配置 ADC 时钟（APB2 时钟 72MHz，分频 6 = 12MHz）
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);

    // ADC 配置
    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;          // 独立模式
    ADC_InitStructure.ADC_ScanConvMode = ENABLE;                // 扫描模式
    ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;          // 单次转换
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;  // 软件触发
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;      // 右对齐
    ADC_InitStructure.ADC_NbrOfChannel = 3;                      // 3 个通道
    ADC_Init(ADC1, &ADC_InitStructure);

    // 配置通道序列和采样时间
    // 通道 0，序列 1，采样时间 55.5 周期
    ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);
    // 通道 1，序列 2，采样时间 55.5 周期
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 2, ADC_SampleTime_55Cycles5);
    // 通道 2，序列 3，采样时间 55.5 周期
    ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 3, ADC_SampleTime_55Cycles5);

    // 使能 ADC
    ADC_Cmd(ADC1, ENABLE);

    // 校准 ADC
    ADC_ResetCalibration(ADC1);
    while (ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while (ADC_GetCalibrationStatus(ADC1));
}

void ADC_Init(void)
{
    ADC_GPIO_Config();
    ADC_Mode_Config();
}
```

### 读取 ADC 值

```c
uint16_t ADC_ReadChannel(uint8_t channel)
{
    // 配置单个通道
    ADC_RegularChannelConfig(ADC1, channel, 1, ADC_SampleTime_55Cycles5);

    // 启动转换
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);

    // 等待转换完成
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);

    // 返回结果
    return ADC_GetConversionValue(ADC1);
}

// 多次采样取平均
uint16_t ADC_ReadChannelAverage(uint8_t channel, uint8_t times)
{
    uint32_t sum = 0;
    for (uint8_t i = 0; i < times; i++)
    {
        sum += ADC_ReadChannel(channel);
    }
    return sum / times;
}
```

## 应用实例

### 电位器分压检测

```c
// 假设 PA0 连接电位器中间抽头
// 电位器两端分别接 3.3V 和 GND

uint16_t ReadPotentiometer(void)
{
    uint16_t adc_value = ADC_ReadChannel(ADC_Channel_0);
    // 将 ADC 值转换为电压（mV）
    uint32_t voltage_mv = adc_value * 3300 / 4096;
    return voltage_mv;
}
```

### 光敏电阻检测

```c
// 假设光敏电阻连接在 PA1
// 使用上拉或下拉电阻构成分压电路

uint16_t ReadLightSensor(void)
{
    uint16_t adc_value = ADC_ReadChannel(ADC_Channel_1);
    return adc_value;  // 值越小表示光线越强（具体取决于电路连接）
}
```

### 多通道轮询采集

```c
#define NUM_CHANNELS  3
uint16_t adc_values[NUM_CHANNELS];

void ADC_ScanChannels(void)
{
    // 配置为扫描模式，单次转换
    ADC_InitTypeDef ADC_InitStructure;
    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;
    ADC_InitStructure.ADC_ScanConvMode = ENABLE;
    ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;
    ADC_InitStructure.ADC_NbrOfChannel = NUM_CHANNELS;
    ADC_Init(ADC1, &ADC_InitStructure);

    // 启动转换
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);

    // 等待所有通道转换完成
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET);

    // 读取结果
    for (int i = 0; i < NUM_CHANNELS; i++)
    {
        adc_values[i] = ADC_GetConversionValue(ADC1);
    }
}
```

## 常见问题

### 1. ADC 值跳动大

**原因**：
- 电源噪声
- 输入阻抗过高
- 采样时间不足
- 参考电压不稳定

**解决方案**：
- 增加采样时间（如 239.5 周期）
- 在 ADC 输入引脚添加滤波电容（100nF）
- 使用多次采样取平均
- 确保参考电压稳定

### 2. ADC 值始终为 0 或 4095

**原因**：
- GPIO 模式配置错误（不是 AIN）
- 通道号配置错误
- 硬件连接问题

**排查**：
- 检查 GPIO 配置
- 确认通道映射正确

### 3. 双 ADC 同步采样配置

```c
// ADC1 和 ADC2 同步采样
void Dual_ADC_Config(void)
{
    // ADC1 配置（为主）
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1, ENABLE);
    ADC_InitStructure.ADC_Mode = ADC_Mode_RegSimultaneous;  // 规则组同步模式
    ADC_InitStructure.ADC_ScanConvMode = ENABLE;
    ADC_InitStructure.ADC_ContinuousConvMode = ENABLE;
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;
    ADC_InitStructure.ADC_NbrOfChannel = 1;
    ADC_Init(ADC1, &ADC_InitStructure);

    // ADC2 配置（为从）
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC2, ENABLE);
    ADC_InitStructure.ADC_Mode = ADC_Mode_RegSimultaneous;
    ADC_Init(ADC2, &ADC_InitStructure);

    // ADC2 配置触发源
    ADC_ExternalTrigConvCmd(ADC2, ENABLE);

    // 使能 DMA（ADC1 的 DMA）
    ADC_DMACmd(ADC1, ENABLE);

    // 启动校准和转换
    // ...
}
```

## 总结

ADC 是嵌入式系统中非常重要的外设：

- **逐次逼近原理**：12 位分辨率，4096 个量化级别
- **转换时间**：采样时间 + 12 周期
- **DMA 模式**：解放 CPU，实现高速连续采样
- **温度传感器和 Vrefint**：内部校准资源
- **双 ADC 模式**：同步采样提高采样率

掌握 ADC 的配置和应用对于传感器数据采集至关重要。
