"use strict";

const stapi = "http://stapi.co/api/v1/rest/";

const init = {
  method: "GET",
  mode: "cors",
  cache: "default",
};

var domResults = document.getElementById("results");
var ctx = document.getElementById("season-episodes").getContext("2d");

async function getPages(thing, pages) {
  for (let i = 1; i < pages; ++i) {}
}

async function runAsync() {
  let response = await fetch(stapi + "season/search?sort=title,ASC", init);
  let results = await response.json();

  console.log(results);

  makeChart(results.seasons);
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

  var myChart = new Chart(ctx, config);
}

runAsync();
