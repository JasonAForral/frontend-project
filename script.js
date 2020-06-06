"use strict";

// This is the main API to gather initial data
const stapi = "http://stapi.co/api/v1/rest/";

// These are the initial
const init = {
  method: "GET",
  mode: "cors",
  cache: "default",
};

// selection to choose colors from
const fillColors = [
  "#933",
  "#963",
  "#033",
  "#c66",
  "#c96",
  "#366",
  "#f99",
  "#fc9",
  "#699",
];

/**
 * get Fill Color helper function to choose a color based on an index value
 * @param {Number} index value to take modulus
 */
function getFillColor(index) {
  return fillColors[index % fillColors.length];
}

// canvas context elements
let ctxSeasons = document.getElementById("season-episodes").getContext("2d");
let ctxWeapons = document.getElementById("weapon-properties").getContext("2d");
let ctxHandheld = document.getElementById("weapon-handheld").getContext("2d");
let ctxTimeline = document.getElementById("timeline-chart").getContext("2d");

// setup charts before API calls
let seasonsChart = new Chart(ctxSeasons, {
  type: "line",
  options: {
    aspectRatio: 1,
    tooltips: { mode: "nearest", intersect: false },
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: "Episodes",
          },
        },
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Season of Series",
          },
        },
      ],
    },
  },
});

let weaponTechChart = new Chart(ctxWeapons, {
  type: "bar",
  options: {
    aspectRatio: 1,
    legend: {
      position: "top",
    },
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: "Weapon Models",
          },
        },
      ],
    },
  },
});

let weaponHandheldChart = new Chart(ctxHandheld, {
  type: "pie",
  options: {
    aspectRatio: 1,
    legend: {
      position: "top",
    },
  },
});

let timelineChart = new Chart(ctxTimeline, {
  type: "line",
  options: {
    aspectRatio: 1,
    scales: {
      xAxes: [
        {
          type: "time",
          time: {
            displayFormats: {
              quarter: "MMM YYYY",
              max: new Date(),
              min: "1966-10-02",
            },
          },
          position: "bottom",
        },
      ],
      yAxes: [
        {
          display: false,
        },
      ],
    },
  },
});

const seriesDom = document.getElementById("series-table");

/**
 * API caller function returns a promise with data
 * @param {string} query query information
 */
async function callSTAPI(query) {
  let response = await fetch(stapi + query, init);
  return await response.json();
}

/**
 * setup Seasons calls API for season information and displays on chart
 */
async function setupSeasons() {
  let seriesPromise = callSTAPI("series/search?sort=title,ASC");
  let results = await callSTAPI("season/search?sort=title,ASC");
  let seriesResults = await seriesPromise;
  return makeSeasonsChart(results.seasons, seriesResults.series);
}

/**
 * make Seasons Chart
 * @param {Object} seasonData Object containing season data to display on chart
 */
function makeSeasonsChart(seasonData, seriesData) {
  let maxSeasons = 0;

  const datasets = seasonData.reduce((acc, curr) => {
    // get series title
    const series = seriesData.find((s) => s.uid === curr.series.uid);
    const abbr = series.abbreviation;

    // check if title exists in the datasets
    let index = acc.findIndex((item) => item.label === abbr);
    if (index < 0) {
      // setup new series dataset
      index = acc.length;
      acc[index] = {
        label: abbr,
        data: [],
        borderColor: getFillColor(index),
        backgroundColor: getFillColor(index),
        fill: false,
        startDate: new Date(series.originalRunStartDate),
        // endDate may be null if it's still running
        endDate: series.originalRunEndDate
          ? new Date(series.originalRunEndDate)
          : new Date(),
        series,
      };
    }

    // add data to dataset
    const seasonNumber = curr.seasonNumber;
    acc[index].data[seasonNumber - 1] = curr.numberOfEpisodes;

    // keep track of max season
    if (seasonNumber > maxSeasons) maxSeasons = seasonNumber;

    return acc;
  }, []);

  let timelineDatasets = [];

  datasets.sort((a, b) => a.startDate - b.startDate);

  let index = 0;

  seriesDom.firstElementChild.remove()

  for (let series of datasets) {
    // create dom elements
    let tr = document.createElement("tr");
    let title = document.createElement("td");
    let abbr = document.createElement("td");
    let startDate = document.createElement("td");

    // fill table and append
    title.textContent = series.series.title;
    abbr.textContent = series.label;
    startDate.textContent = series.startDate.toLocaleDateString();
    tr.append(title, abbr, startDate);
    seriesDom.append(tr);

    timelineDatasets.push({
      label: series.label,
      data: [
        {
          x: series.startDate,
          y: index,
        },
        {
          x: series.endDate,
          y: index,
        },
      ],
      borderColor: getFillColor(index),
      backgroundColor: getFillColor(index),
      fill: false,
    });
    ++index;
  }

  const chartData = {
    datasets,
    labels: new Array(maxSeasons).fill(0).map((n, i) => `Season ${i + 1}`),
  };

  const timelineChartData = {
    datasets: timelineDatasets,
    labels: "abcdefghijklmno",
  };

  seasonsChart.data = chartData;
  seasonsChart.update();

  timelineChart.data = timelineChartData;
  timelineChart.update();

  return seasonsChart;
}

/**
 * setup Weapons calls API for season information and displays on chart
 */
async function setupWeapons() {
  let results = await callSTAPI("weapon/search?sort=uid,ASC");
  const { weapons, page } = results;
  const { lastPage, totalPages } = page;

  // if this is not the last page, query other pages
  if (!lastPage) {
    const pagePromises = [];
    for (var i = 1; i < totalPages; ++i) {
      pagePromises.push(
        callSTAPI("weapon/search?sort=uid,ASC&pageNumber=" + i)
      );
    }

    // wait for all the pages to load
    const otherPages = await Promise.all(pagePromises);
    for (let otherPage of otherPages) {
      weapons.push(...otherPage.weapons);
    }
  }

  //#region weapon tech
  async function makeWeaponsChart(weapons) {
    let aggregateData = {
      alternateReality: 0,
      handHeldWeapon: 0,
      laserTechnology: 0,
      mirror: 0,
      phaserTechnology: 0,
      photonicTechnology: 0,
      plasmaTechnology: 0,
      multipleTech: 0,
      // noTech: 0,
    };

    aggregateData = weapons.reduce((acc, curr) => {
      acc.alternateReality += curr.alternateReality;
      acc.handHeldWeapon += curr.handHeldWeapon;
      acc.mirror += curr.mirror;

      // tally weapons with more than one technology
      const numTech =
        curr.laserTechnology +
        curr.phaserTechnology +
        curr.photonicTechnology +
        curr.plasmaTechnology;

      if (numTech > 1) {
        ++acc.multipleTech;
        // console.log("multiple tech", curr);
        // } else if (numTech === 0) {
        // ++acc.noTech;
        // console.log("no tech", curr);
      }

      acc.laserTechnology += curr.laserTechnology;
      acc.phaserTechnology += curr.phaserTechnology;
      acc.photonicTechnology += curr.photonicTechnology;
      acc.plasmaTechnology += curr.plasmaTechnology;
      return acc;
    }, aggregateData);

    // filter keys that include technology
    let technologies = {};
    for (let key in aggregateData) {
      if (key.indexOf("Technology") > 0) technologies[key] = aggregateData[key];
    }

    let keys = Object.keys(technologies);

    let datasets = keys.map((key, i) => ({
      label: key.slice(0, 1).toLocaleUpperCase() + key.slice(1, -10),
      data: [technologies[key]],
      backgroundColor: getFillColor(i),
    }));

    const chartData = {
      labels: ["Technology"],
      datasets,
    };

    weaponTechChart.data = chartData;
    weaponTechChart.update();
    return weaponTechChart;
  }
  makeWeaponsChart(weapons);
  //#endregion

  //#region weapon handheld
  {
    const datasets = weapons.reduce(
      (acc, curr) => {
        ++acc[Number(curr.handHeldWeapon)];
        return acc;
      },
      [0, 0]
    );

    const chartData = {
      labels: ["Not Handheld", "Handheld"],
      datasets: [
        {
          data: datasets,
          backgroundColor: [getFillColor(0), getFillColor(1)],
        },
      ],
    };

    weaponHandheldChart.data = chartData;
    weaponHandheldChart.update();
  }
  //#endregion

  return weapons;
}

/**
 * init Async initializes data by calling fetch functions then
 * awaits arival
 */
async function initAsync() {
  let seasonsPromise = setupSeasons();
  let weaponsPromise = setupWeapons();

  let charts = await Promise.all([seasonsPromise, weaponsPromise]);
}

initAsync();
