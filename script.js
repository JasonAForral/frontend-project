"use strict";

const stapi = "http://stapi.co/api/v1/rest/";

const init = {
  method: "GET",
  mode: "cors",
  cache: "default",
};

const fillColors = ["#933", "#963", "#033"];

function getFillColor(index) {
  return fillColors[index % fillColors.length];
}

// var domResults = document.getElementById("results");
var ctxSeasons = document.getElementById("season-episodes").getContext("2d");
var ctxWeapons = document.getElementById("weapon-properties").getContext("2d");

async function getPages(thing, pages) {
  for (let i = 1; i < pages; ++i) {}
}

async function callSTAPI(query) {
  let response = await fetch(stapi + query, init);
  return await response.json();
}

async function setupSeasons() {
  let results = await callSTAPI("season/search?sort=title,ASC");
  console.log(results);
  return makeChart(results.seasons);
}

async function setupWeapons() {
  let results = await callSTAPI("weapon/search?sort=uid,ASC");
  const { weapons, page } = results;
  const { lastPage, totalPages } = page;
  console.log("total weapons", page.totalElements);
  if (!lastPage) {
    const pagePromises = [];
    for (var i = 1; i < totalPages; ++i) {
      pagePromises.push(
        callSTAPI("weapon/search?sort=uid,ASC&pageNumber=" + i)
      );
    }
    const otherPages = await Promise.all(pagePromises);
    console.log("other pages", otherPages);
    for (let otherPage of otherPages) {
      weapons.push(...otherPage.weapons);
    }
  }

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

    const numTech =
      curr.laserTechnology +
      curr.phaserTechnology +
      curr.photonicTechnology +
      curr.plasmaTechnology;

    if (numTech > 1) {
      ++acc.multipleTech;
      console.log("multiple tech", curr);
      // } else if (numTech === 0) {
      // ++acc.noTech;
      // console.log("no tech", curr);
    }

    acc.laserTechnology += curr.laserTechnology;
    acc.phaserTechnology += curr.phaserTechnology;
    acc.photonicTechnology += curr.photonicTechnology;
    acc.plasmaTechnology += curr.plasmaTechnology;
    // acc.multipleTech +=
    return acc;
  }, aggregateData);

  let technologies = {};

  for (let key in aggregateData) {
    if (key.indexOf("Technology") > 0) technologies[key] = aggregateData[key];
  }

  console.log('tech', technologies)

  let datasets = [];

  let keys = Object.keys(technologies);

  for (let i = 0; i < keys.length; ++i) {
    let key = keys[i];
    datasets.push({
      label: key,
      data: [aggregateData[key]],
      backgroundColor: getFillColor(i),
    });
  }

  const chartData = {
    lables: keys,
    datasets: datasets,
  };

  let config = {
    type: "bar",
    data: chartData,
    options: {
      legend: {
        position: "bottom",
      },
    },
  };

  new Chart(ctxWeapons, config);

  console.log("aggregate weapon data", aggregateData);

  return weapons;
}

function makeChart(data) {
  const chartData = {
    datasets: [
      {
        label: "Episodes",
        data: data.map((season) => season.numberOfEpisodes),
        borderWidth: 1,
        backgroundColor: data.map((season, i) => getFillColor(i)),
      },
    ],
    labels: data.map((season) => season.title),
  };

  let config = {
    type: "bar",
    data: chartData,
  };

  return new Chart(ctxSeasons, config);
}

async function initAsync() {
  let seasonsPromise = setupSeasons();
  let weaponsPromise = setupWeapons();

  let charts = await Promise.all([seasonsPromise, weaponsPromise]);

  // let seasons = await seasonsPromise

  console.log(charts);
}

initAsync();
