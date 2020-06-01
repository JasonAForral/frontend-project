"use strict";

const stapi = "http://stapi.co/api/v1/rest/";

const init = {
  method: "GET",
  mode: "cors",
  cache: "default",
};

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
  console.log('total weapons', page.totalElements)
  if (!lastPage) {
    const pagePromises = []
    for (var i = 1; i < totalPages; ++i) {
      pagePromises.push(callSTAPI("weapon/search?sort=uid,ASC&pageNumber=" + i))
    }
    const otherPages = await Promise.all(pagePromises)
    console.log('other pages', otherPages)
    for (let otherPage of otherPages) {
      weapons.push(...otherPage.weapons)
    }
  }

  // const chartData = {
  //   datasets: [
  //     {
  //       label: "Episodes",
  //       data: data.map((season) => season.numberOfEpisodes),
  //       borderWidth: 1,
  //     },
  //   ],
  //   labels: data.map((season) => season.title),
  // };

  // let config = {
  //   type: "bar",
  //   data: chartData,
  //   options: {
  //     legend: {
  //       position: "bottom",
  //     },
  //   },
  // };

  // new Chart(ctxWeapons, config);

  return weapons;
}

function makeChart(data) {
  const chartData = {
    datasets: [
      {
        label: "Episodes",
        data: data.map((season) => season.numberOfEpisodes),
        borderWidth: 1,
      },
    ],
    labels: data.map((season) => season.title),
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
