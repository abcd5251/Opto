"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DonutChartProps {
  data: Array<{
    name: string
    percentage: number
    color: string
  }>
  size?: number
  strokeWidth?: number
}

export function DonutChart({ data, size = 180, strokeWidth = 30 }: DonutChartProps) {
  const chartData = data.map((item, index) => ({
    asset: item.name,
    value: item.percentage,
    fill: item.color,
  }))

  const chartConfig = data.reduce((config, item) => {
    config[item.name] = {
      label: item.name,
      color: item.color,
    }
    return config
  }, {} as ChartConfig)

  return (
    <div className="text-white">
      <ChartContainer
        config={chartConfig}
        className={`mx-auto aspect-square`}
        style={{ width: size, height: size }}
      >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="asset"
          innerRadius={size / 2 - strokeWidth + 5}
          outerRadius={size / 2 - 10}
          strokeWidth={2}
          stroke="transparent"
          isAnimationActive={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
    </div>
  )
}
