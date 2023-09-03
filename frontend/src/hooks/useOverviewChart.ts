import * as echarts from "echarts";
import { onMounted, onUnmounted, ref } from "vue";

export function useSimpleChart(dom: string, initData: number[] = []) {
  let chart = ref<echarts.ECharts>();

  onMounted(() => {
    chart.value = echarts.init(document.getElementById(dom));
    chart.value.setOption(getSimpleChartDefaultOption(initData));
  });

  onUnmounted(() => {
    chart.value?.dispose();
    chart.value = undefined;
  });

  return {
    instance: chart,
    setOption: (v: any) => chart.value?.setOption(v)
  };
}

export function useOverviewChart(dom: string) {
  let chart = ref<echarts.ECharts>();

  onMounted(() => {
    chart.value = echarts.init(document.getElementById(dom));
    chart.value.setOption(getChartDefaultOption());
  });

  onUnmounted(() => {
    chart.value?.dispose();
    chart.value = undefined;
  });

  return {
    instance: chart,
    setOption: (v: any) => chart.value?.setOption(v)
  };
}

function getChartDefaultOption() {
  const color: any = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: "rgb(67, 145, 250,0.8)"
    },
    {
      offset: 1,
      color: "rgb(17, 95, 200,0)"
    }
  ]);
  return {
    grid: {
      show: false,
      borderWidth: 0,
      top: 8,
      bottom: 30,
      left: 30,
      right: 8
    },
    xAxis: { type: "category", show: true },
    yAxis: { type: "value", min: 0, max: 100, show: true, minInterval: 1 },
    series: [
      {
        type: "line",
        color,
        smooth: true,
        symbol: "none",
        lineStyle: {
          color: "rgb(67, 145, 250,0.9)",
          width: 1
        },
        areaStyle: {}
      }
    ]
  };
}

function getSimpleChartDefaultOption(data: number[] = []) {
  // const randomNumbers = Array.from({ length: 60 }, () => 0);
  return {
    grid: {
      show: false,
      borderWidth: 0,
      top: 10,
      bottom: 0,
      left: 0,
      right: 0
    },
    xAxis: { type: "category", show: false },
    yAxis: { type: "value", min: 0, max: 100, show: false, minInterval: 1 },
    series: [
      {
        // data: data || randomNumbers,
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: "rgb(67, 145, 250,0.9)",
          width: 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgb(67, 145, 250,0.8)"
            },
            {
              offset: 1,
              color: "rgb(17, 95, 200,0)"
            }
          ])
        }
      }
    ]
  };
}