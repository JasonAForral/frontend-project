'use strict'

const stapi = "http://stapi.co/api/v1/rest/"

const init = {
  method: "GET",
  mode: "cors",
  cache: "default",
};

var domResults = document.getElementById('results')

async function getPages(thing, pages) {
  for (let i = 1; i < pages; ++i) {

  }
}

async function runAsync() {
  let response = await fetch(stapi + "season/search?sort=title,ASC", init);
  let results = await response.json();

  console.log(results)

  // domResults.textContent = JSON.stringify(results)

  makeChart(results.seasons)
}

function makeChart(data) {
  // let config = {
  //   type: "bars",
  //   data: chartData,
  //   options: {
  //     legend: {
  //       position: "bottom",
  //     },
  //   },
  // };
}

runAsync();