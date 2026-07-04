---
title: "嵌入式存储体系：从 SPI Flash 到 STM32 内部 Flash"
description: "系统梳理单片机存储体系，从存储介质原理到 SPI Flash 驱动再到 STM32 内部 Flash 操作，并展望 STM32 最新 Flash 技术演进方向。"
authors: yamahoney
tags: [stm32, 入门教程, 干货分享]
date: 2026-07-02
---

# 嵌入式存储体系：从 SPI Flash 到 STM32 内部 Flash

嵌入式开发中，存储是一个绕不开的核心话题。从代码的存放、运行，到运行时数据的掉电保存，都离不开各种存储器。

<!-- truncate -->

本文系统梳理了整个存储知识体系，涵盖以下内容：

**① 存储器基础** — 物理层三大存储方式（磁/光/半导体），NAND vs NOR 对比，单片机系统常用存储方案一览。

**② SPI Flash 概述** — 主要厂家（Winbond/MXIC/GD），W25Q64 数据手册关键参数与常用指令。

**③ SPI Flash 驱动分析** — HAL 库 SPI 函数封装，BSP_W25Qx_Read/Write 代码实现，跨页写/自动跨页读等六大核心要点。

**④ 驱动进阶与工程化** — 擦除均衡（Wear Leveling）、文件系统（FATFS/LittleFS/SPIFFS）、数据校验（CRC/ECC）。

**⑤ STM32 内部 Flash 详解** — 主存储器/系统存储区/OTP/选项字节结构，F4 系列扇区分布表，双块模式（DB1M），电源电压与操作位宽。

**⑥ 内部 Flash 读写实战** — 解锁（KEY1/KEY2）、扇区擦除、32 位写入、字节读取的完整代码实现与易错点。

**⑦ STM32 Flash 技术演进** — 双 Bank 无损 OTA、OTFDEC/HUK/ST-iROT 安全技术、容量跃升至 4MB、16nm FinFET → 18nm FD-SOI + ePCM 工艺进步。

**⑧ 总结与要点备忘** — 知识脉络图、易错点速查表、选型决策速查表。

---

👉 **[阅读完整知识库内容 →](/docs/stm32/stm32-basics/memory-spiflash)**

> 本篇内容同步收录于 **STM32 基础知识** 知识库，支持 sidebar 导航翻页，适合系统化学习。
