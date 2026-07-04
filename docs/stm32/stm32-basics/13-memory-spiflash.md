---
sidebar_position: 14
title: 存储体系：SPI Flash 与内部 Flash
---

# 嵌入式存储体系：从 SPI Flash 到 STM32 内部 Flash

嵌入式开发中，存储是一个绕不开的核心话题。从代码的存放、运行，到运行时数据的掉电保存，都离不开各种存储器。本节系统梳理整个存储知识体系，从存储介质原理到 SPI Flash 驱动再到 STM32 内部 Flash 操作。

---

## 一、存储器基础

### 1.1 物理层存储方式

从物理原理上，存储器分为三大类：

| 存储类型 | 原理 | 典型代表 |
|---------|------|---------|
| **磁存储** | 磁介质磁化方向记录 0/1 | 磁带、软盘、机械硬盘（HDD） |
| **光存储** | 激光烧蚀凹坑反射差异 | CD、DVD |
| **半导体存储** | 电荷/晶体管状态存储 | EEPROM、NAND Flash、NOR Flash、SRAM、DRAM |

嵌入式领域最常用的是**半导体存储**，尤其是 Flash 家族的 NAND 和 NOR。

### 1.2 NAND Flash vs NOR Flash 对比

| 对比维度 | NAND Flash | NOR Flash |
|---------|-----------|-----------|
| 容量 | 大（GB 级别），价格低 | 小（MB 级别），价格高 |
| 读取方式 | 按块/页访问，不能按字节 | **按字节读取**，支持 XIP（原地执行） |
| 写入方式 | 按页写，按块擦除 | 按字节/半字写，按扇区/块擦除 |
| 访问接口 | 专用时序接口（8/16bit 总线） | 专用时序接口（或 SPI） |
| 典型用途 | 大容量数据存储（文件系统） | 代码存储、小容量参数存储 |
| 寿命（擦写次数） | 1k~100k 次（取决于制程） | 10k~100k 次 |

> **核心区别一句话：** NOR 像内存一样可以按字节读，适合存代码；NAND 容量大但只能按块读，适合存数据。

### 1.3 单片机系统常用存储方案

| 存储需求 | 推荐方案 | 容量范围 | 接口 |
|---------|---------|---------|------|
| 程序代码存储 | 内部 Flash（本质是 NOR Flash） | 16KB ~ 4MB | 内部总线 |
| 少量掉电不丢失数据 | EEPROM（如 24C02） | 2KB ~ 256KB | I²C |
| 中量掉电不丢失数据 | SPI NOR Flash（如 W25Q64） | 64KB ~ 32MB | SPI |
| 大量掉电不丢失数据 | SPI NAND Flash | 32MB ~ 1GB | SPI |
| 可插拔扩展存储 | TF/SD 卡、U 盘 | GB 级别 | SDIO/USB |
| 板载大容量存储 | eMMC 芯片 | 4GB ~ 256GB | eMMC 接口 |
| 新型封装存储 | SD NAND（芯片封装的 SD 卡） | nMB ~ 1GB | SDIO/SPI |

---

## 二、SPI Flash 概述

### 2.1 什么是 SPI Flash

SPI Flash = **SPI 接口芯片 + 内部 NOR/NAND 存储颗粒**。通过 SPI 总线与 MCU 通信，结构简单、引脚少（SCK/MOSI/MISO/CS 四线），是嵌入式系统中最常用的外部存储方案之一。

### 2.2 主要厂家

| 厂家 | 国家/地区 | 产品前缀 | 特点 |
|-----|-----------|---------|------|
| **Winbond 华邦** | 台湾 | W25Qxx | 市场占有率最高，资料最丰富 |
| **MXIC 旺宏** | 台湾 | MX25Lxx | 与 Winbond 管脚兼容 |
| **GD 兆易创新** | 大陆 | GD25Qxx | 国产替代首选，性价比高 |

> 各厂家同容量型号**物理上管脚基本兼容**，可以直接替换；**软件上仅有少量差异**，移植工作量很小。

### 2.3 W25Q64 数据手册速览

以最常用的 **W25Q64**（8MB 容量）为例：

| 参数 | 值 |
|------|-----|
| 容量 | 64Mbit（8MByte） |
| 页大小 | 256 字节 |
| 扇区大小 | 4KB（16 页） |
| 块大小 | 64KB（16 个扇区） |
| 擦除单位 | 扇区擦除（4KB）/ 块擦除（64KB）/ 整芯片擦除 |
| 写入方式 | 按页写（最大 256 字节/次） |
| SPI 速率 | 最高 133MHz（双线/四线模式更快） |
| 寿命 | 典型 10 万次擦写 |
| 数据保持 | 20 年以上 |

**常用指令：**

| 指令 | 代码 | 说明 |
|-----|------|------|
| WREN | 0x06 | 写使能 |
| WRDI | 0x04 | 写禁止 |
| PP（Page Program） | 0x02 | 页编程（写入） |
| READ | 0x03 | 读数据 |
| Sector Erase | 0x20 | 扇区擦除（4KB） |
| Block Erase | 0xD8 | 块擦除（64KB） |
| RDSR1 | 0x05 | 读状态寄存器 1（检查 BUSY 位） |

---

## 三、SPI Flash 驱动分析

### 3.1 CubeMX / HAL 库中的 SPI 封装

STM32 HAL 库对 SPI 外设做了高层封装，核心函数：

```c
// SPI 发送 + 接收（全双工）
HAL_StatusTypeDef HAL_SPI_TransmitReceive(SPI_HandleTypeDef *hspi,
                                          uint8_t *pTxData,
                                          uint8_t *pRxData,
                                          uint16_t Size,
                                          uint32_t Timeout);

// SPI 只发送
HAL_StatusTypeDef HAL_SPI_Transmit(SPI_HandleTypeDef *hspi,
                                   uint8_t *pTxData,
                                   uint16_t Size,
                                   uint32_t Timeout);

// SPI 只接收
HAL_StatusTypeDef HAL_SPI_Receive(SPI_HandleTypeDef *hspi,
                                  uint8_t *pRxData,
                                  uint16_t Size,
                                  uint32_t Timeout);
```

### 3.2 SPI Flash 驱动核心逻辑

以 W25Q64 为例，驱动封装了几个关键操作：

**读数据（最简单的操作）：**

```c
void BSP_W25Qx_Read(uint8_t *pBuffer, uint32_t ReadAddr, uint32_t NumByteToRead) {
    /* 1. 拉低 CS 片选 */
    W25Qx_CS_LOW();

    /* 2. 发送读指令 0x03 + 24 位地址 */
    uint8_t cmd[4] = {0x03,
                      (ReadAddr >> 16) & 0xFF,
                      (ReadAddr >> 8) & 0xFF,
                      ReadAddr & 0xFF};
    HAL_SPI_Transmit(&hspi1, cmd, 4, HAL_MAX_DELAY);

    /* 3. 连续读取数据 */
    HAL_SPI_Receive(&hspi1, pBuffer, NumByteToRead, HAL_MAX_DELAY);

    /* 4. 拉高 CS */
    W25Qx_CS_HIGH();
}
```

**写数据（需先擦除再写，且不可跨页）：**

```c
void BSP_W25Qx_Write(uint8_t *pBuffer, uint32_t WriteAddr, uint32_t NumByteToWrite) {
    uint32_t page_offset, remain_in_page, to_write;

    while (NumByteToWrite > 0) {
        /* 计算当前页内的偏移和剩余空间 */
        page_offset = WriteAddr % 256;
        remain_in_page = 256 - page_offset;
        to_write = (NumByteToWrite < remain_in_page) ? NumByteToWrite : remain_in_page;

        /* 写使能 */
        BSP_W25Qx_WriteEnable();

        /* 页编程指令 */
        W25Qx_CS_LOW();
        uint8_t cmd[4] = {0x02,
                          (WriteAddr >> 16) & 0xFF,
                          (WriteAddr >> 8) & 0xFF,
                          WriteAddr & 0xFF};
        HAL_SPI_Transmit(&hspi1, cmd, 4, HAL_MAX_DELAY);
        HAL_SPI_Transmit(&hspi1, pBuffer, to_write, HAL_MAX_DELAY);
        W25Qx_CS_HIGH();

        /* 等待 BUSY 位清除 */
        while (BSP_W25Qx_IsBusy());

        /* 更新指针和计数 */
        WriteAddr  += to_write;
        pBuffer    += to_write;
        NumByteToWrite -= to_write;
    }
}
```

### 3.3 五大核心要点总结

| 要点 | 说明 |
|------|------|
| **① 写起始地址不要求页对齐** | 可从任意地址开始，驱动自动处理页内偏移 |
| **② 单次写不能跨页** | 如果数据跨页，必须拆分为多次 Page Program |
| **③ `BSP_W25Qx_Write` 实现了跨页封装** | 用户只需传入起始地址和长度，驱动自动拆分 |
| **④ 读数据可以自动跨页** | 发送连续读指令 0x03 后，地址会自动递增，无需额外处理 |
| **⑤ 读写的最小单位是 1 字节** | 相比 NAND 的块/页访问，SPI NOR 更灵活 |
| **⑥ 写之前必须先擦除** | SPI NOR 不能从 1 写到 0 再写回 1，必须先擦除为全 1 再写 |

---

## 四、驱动进阶与工程化

在实际产品中，裸写 SPI Flash 驱动只是第一步，工程化还需要考虑以下问题：

### 4.1 擦除均衡（Wear Leveling）

NOR Flash 每个扇区有擦写寿命限制（约 10 万次）。如果反复擦写同一个扇区，它很快就会报废。

**解决方案：** 建立逻辑地址到物理扇区的映射表，写数据时轮换使用不同的物理扇区，将擦写均匀分布到整个芯片。

### 4.2 文件系统

当需要在 SPI Flash 上管理多个文件时，可挂载轻量级文件系统：

| 文件系统 | 适用场景 | 特点 |
|---------|---------|------|
| **FATFS** | 通用，兼容 PC | 支持长文件名，需额外写 SPI Flash 驱动层 |
| **LittleFS** | 嵌入式优先 | 掉电安全、擦除均衡内置，由 ARM 开发 |
| **SPIFFS** | 小容量 SPI Flash | 轻量，专为 SPI NOR Flash 设计 |

### 4.3 数据校验

Flash 在擦写和存储过程中可能发生位翻转（bit flip），尤其是随着使用时间增长：

- **CRC32**：写入时计算校验值，读取时校验
- **ECC（纠错码）**：硬件 ECC（如 STM32 FMC 接口）或软件 ECC
- **备份冗余**：关键数据存 2~3 份，读取时 majority vote

---

## 五、STM32 内部 Flash 详解

### 5.1 内部 Flash 结构

STM32 内部 Flash 包含以下区域（以 STM32F42x/43x 系列，2MB 容量为例）：

| 区域 | 说明 |
|------|------|
| **主存储器** | 存储用户代码和数据，按扇区组织 |
| **系统存储区** | 出厂固化的 ISP 启动代码（用户不可访问） |
| **OTP 区域** | 一次性编程区域，512 字节，用于存密钥 |
| **选项字节** | 配置读写保护、BOR、看门狗等 |

### 5.2 主存储器扇区分布

| 扇区 | 地址范围 | 大小 |
|------|---------|------|
| 扇区 0 | 0x0800 0000 ~ 0x0800 3FFF | 16 KB |
| 扇区 1 | 0x0800 4000 ~ 0x0800 7FFF | 16 KB |
| 扇区 2 | 0x0800 8000 ~ 0x0800 BFFF | 16 KB |
| 扇区 3 | 0x0800 C000 ~ 0x0800 FFFF | 16 KB |
| 扇区 4 | 0x0801 0000 ~ 0x0801 FFFF | 64 KB |
| 扇区 5 | 0x0802 0000 ~ 0x0803 FFFF | 128 KB |
| 扇区 6 ~ 11 | 依次递增 | 各 128 KB |

> 对于 1MB 型号，只包含扇区 0~11；2MB 型号还有块 2（扇区 12~23）。
> STM32F40x 系列**没有**双块格式和扇区 12~23，仅 F42x/43x 支持。

**双块模式（DB1M）：** STM32F42x/43x 可通过配置 `FLASH_OPTCR` 寄存器的 `DB1M` 位，将 1MB Flash 从单块（8 个大扇区）切换为双块（16 个小扇区），便于更精细的擦除管理。

### 5.3 电源电压与操作位宽

内部 Flash 擦写时，电源电压决定单次最大操作位数：

| 电压范围 | 最大位宽 | PSIZE[1:0] |
|---------|---------|-----------|
| 2.7~3.6V（外加 Vpp 8~9V） | 64 位 | 11 |
| 2.7~3.6V | 32 位 | 10 |
| 2.1~2.7V | 16 位 | 01 |
| 1.8~2.1V | 8 位 | 00 |

> 64 位模式需外部 Vpp 引脚加高压，量产烧录时使用，普通开发用 32 位即可。

---

## 六、内部 Flash 读写实战

### 6.1 解锁 Flash

芯片复位后，Flash 控制寄存器默认处于**上锁**状态，防止误写。写数据前需要解锁：

```c
void FLASH_Unlock(void) {
    /* 写入解锁密钥，顺序固定 */
    FLASH->KEYR = 0x45670123;  // KEY1
    FLASH->KEYR = 0xCDEF89AB;  // KEY2
}
```

> 如果密钥写错，Flash 会被锁定到下次复位。

### 6.2 扇区擦除

写入新数据前，必须先将目标扇区擦除（将位从 0 清为 1）：

```c
void FLASH_EraseSector(uint32_t SectorNumber) {
    /* 1. 等待 BSY 位清除 */
    while (FLASH->SR & FLASH_SR_BSY);

    /* 2. 配置擦除参数 */
    FLASH->CR |= FLASH_CR_SER;          // 激活扇区擦除
    FLASH->CR &= ~FLASH_CR_SNB;         // 清除扇区号位
    FLASH->CR |= SectorNumber << 3;      // 设置要擦除的扇区

    /* 3. 启动擦除 */
    FLASH->CR |= FLASH_CR_STRT;

    /* 4. 等待擦除完成 */
    while (FLASH->SR & FLASH_SR_BSY);

    /* 5. 检查错误 */
    if (FLASH->SR & FLASH_SR_EOP) {
        FLASH->SR |= FLASH_SR_EOP;      // 清除完成标志
    }

    /* 6. 关闭擦除位 */
    FLASH->CR &= ~FLASH_CR_SER;
}
```

### 6.3 写入数据（32 位）

```c
void FLASH_ProgramWord(uint32_t Address, uint32_t Data) {
    /* 1. 等待 BSY 清除 */
    while (FLASH->SR & FLASH_SR_BSY);

    /* 2. 激活编程模式 */
    FLASH->CR |= FLASH_CR_PG;

    /* 3. 写入 32 位数据 */
    *(__IO uint32_t *)Address = Data;

    /* 4. 等待完成 */
    while (FLASH->SR & FLASH_SR_BSY);

    /* 5. 关闭编程位 */
    FLASH->CR &= ~FLASH_CR_PG;
}
```

HAL 库封装了更友好的接口：

```c
HAL_StatusTypeDef HAL_FLASH_Program(uint32_t TypeProgram,
                                    uint32_t Address,
                                    uint64_t Data);
```

- `TypeProgram`：`FLASH_TYPEPROGRAM_WORD`（32 位）或 `FLASH_TYPEPROGRAM_DOUBLEWORD`（64 位）
- 返回 `HAL_OK` 表示成功

### 6.4 读取数据

内部 Flash 读操作最简单——直接通过指针访问：

```c
uint32_t data = *(__IO uint32_t *)0x08040000;   // 32 位读取
uint8_t  byte = *(__IO uint8_t  *)0x08040000;   // 字节读取
```

> 读取没有地址对齐限制，也没有擦除前置条件。

### 6.5 注意事项与易错点

| 要点 | 详细说明 |
|------|---------|
| **擦除后是全 F** | 擦除后每个字节 = `0xFF`，不是 `0x00` |
| **只能从 1 写为 0** | 要恢复 0→1 只能擦除，不能单独写 |
| **操作期间关中断** | Flash 擦写时，CPU 取指可能被阻塞，建议关中断 |
| **地址范围** | 不要擦写自己的代码区，指定向预留的存储扇区 |
| **寿命限制** | 内部 Flash 典型 10k 次擦写（STM32U5 可达 100k 次） |
| **64 位写注意字节序** | Double Word 写入时，低 32 位在低地址 |

---

## 七、STM32 Flash 技术演进与最新发展

STM32 系列的 Flash 技术近年来发展迅猛，了解演进方向有助于选型和规划：

### 7.1 双 Bank Flash → 无损 OTA

从 STM32F7/H7 时代开始，**双 Bank Flash** 逐渐成为主流。将 Flash 拆分为两个 Bank，运行 Bank1 时擦写 Bank2，然后切换启动，实现**应用程序的无中断升级**（OTA）。

| 系列 | 双 Bank | 代表型号 |
|------|---------|---------|
| H7 | ✓ | 双 Bank 切换 |
| H5 | ✓ 全系标配 | H563/H573 |
| U5 | ✓ | U575/U585 |

### 7.2 安全 Flash：OTFDEC + HUK + TrustZone

新一代 STM32（H5、U5、N6）引入了多层次的安全 Flash 技术：

- **OTFDEC（On-The-Fly Decryption）**：从 Flash 读取代码时**实时解密**，代码在 Flash 中以密文存储
- **HUK（Hardware Unique Key）**：每个芯片独一无二的硬件密钥，用于加密/解密
- **ST-iROT（Immutable Root of Trust）**：不可变的信任根，确保启动链安全
- **ECC 纠错码**：Flash 和 SRAM 均支持，检测并纠正单比特错误

### 7.3 Flash 容量跃升

| 时代 | 代表系列 | 最大内部 Flash |
|------|---------|---------------|
| 早期 | STM32F1 | 512KB |
| 中期 | STM32F4/F7 | 1MB~2MB |
| 先进 | STM32H7 | 2MB |
| **当前** | **STM32U5/H5** | **4MB** |

STM32U5 更是将擦写寿命从传统 10k 次提升到了 **100k 次**（512KB 区域），接近 SPI NOR Flash 的水平。

### 7.4 工艺进步与新型存储

| 工艺节点 | 代表产品 | 意义 |
|---------|---------|------|
| **40nm** | STM32H5/U5/G0/C0 | 成熟主流 |
| **16nm FinFET** | **STM32N6** | 首次在 MCU 上采用，搭配 4.2MB RAM |
| **18nm FD-SOI + ePCM** | 下一代 MCU（研发中） | **嵌入式相变存储器**替代 NOR Flash |

> **ePCM（Embedded Phase-Change Memory，嵌入式相变存储器）**：利用硫系材料在晶态和非晶态之间的电阻差异存储数据，密度远高于 NOR Flash，写入速度更快、功耗更低。ST 已发布白皮书，明确下一代高性能 MCU 将采用 **18nm FD-SOI + ePCM** 方案。

### 7.5 趋势总结：内部 Flash 的角色正在变化

随着工艺进步和架构演进，内部 Flash 的角色正在分层：

- **高端（N6/H7）**：大 RAM（4.2MB）+ 外部高速 SPI / OCTOSPI Flash 执行代码，内部 Flash 专注安全关键区
- **中端（H5/U5）**：大内部 Flash（2~4MB）+ 双 Bank + 硬件安全引擎，单芯片完成应用 + OTA + 安全启动
- **入门（C0/G0）**：Flash 容量稳步增长（最高 512KB），持续降低 BOM

---

## 八、总结与要点备忘

### 8.1 核心知识脉络

```
存储物理原理（磁/光/半导体）
    └── Flash 两大分支：NAND vs NOR
            ├── SPI NOR Flash（外部存储，W25Q64）
            │     ├── 驱动要点：跨页写、自动跨页读
            │     └── 工程化：擦除均衡、文件系统、校验
            └── STM32 内部 Flash
                  ├── 结构：主存 + 系统区 + OTP + 选项字节
                  ├── 操作：解锁 → 擦除 → 写入 → 读取
                  └── 演进：双 Bank → 安全 Flash → ePCM
```

### 8.2 易错点速查

| 场景 | 关键要点 |
|------|---------|
| SPI Flash 写 | 写前擦除、不可跨页 |
| SPI Flash 读 | 自动跨页，无需额外处理 |
| 内部 Flash 写 | 解锁（KEY1→KEY2）、关中断、地址对齐 |
| 内部 Flash 读 | 直接用指针，没有限制 |
| 擦除后状态 | Flash 擦除后是全 `0xFF`，不是 `0x00` |
| 写反转 | 只能 1→0，要恢复 0→1 必须擦除 |

### 8.3 选型决策速查

| 需求 | 推荐方案 | 理由 |
|------|---------|------|
| 存代码 | 内部 Flash / SPI NOR | NOR 支持按字节读和 XIP |
| 存少量参数 | EEPROM / 内部 Flash 末尾扇区 | 接口简单、单芯片方案 |
| 存日志或文件 | SPI NOR + LittleFS / FATFS | 容量适中、驱动成熟 |
| 存大容量媒体数据 | SPI NAND / SD 卡 / eMMC | 单位成本最低 |
| 安全要求高 | STM32U5/H5 内部 Flash | OTFDEC + TrustZone |
| 需要远程升级 | 双 Bank Flash 型号 | 无损 OTA |

---

> **参考资料：**
> - STM32F4xxx 参考手册（RM0090）
> - W25Q64 数据手册（Winbond）
> - AN4826：STM32F42x/43x 内部 Flash 编程手册
> - [孤情剑客：STM32 的内部 FLASH](https://www.cnblogs.com/The-explosion/p/12305871.html)
> - STM32U5/H5/N6 产品白皮书
