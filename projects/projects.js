import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let projects = [];
let selectedIndex = -1;

const svg = d3.select('#projects-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');

async function loadProjects() {
  const data = await fetchJSON('../lib/projects.json');
  if (!data) return;
  projects = data;
  renderProjects(projects, projectsContainer, 'h2');
  renderPieChart(projects);
}

function renderPieChart(projectsGiven) {
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

  const width = 300, height = 300, radius = 120;
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const g = svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  const paths = g
    .selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc)
    .attr('fill', (_, i) => colors(i))
    .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null))
    .on('click', (_, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;

      // Update classes on paths
      g.selectAll('path').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );

      // Update classes on legend items
      legend.selectAll('li').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );
    })
    .append('title')
    .text(d => `${d.data.label}: ${d.data.value}`);

  const legendItems = legend
    .selectAll('li')
    .data(data)
    .join('li')
    .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null))
    .on('click', (_, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;

      g.selectAll('path').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );

      legend.selectAll('li').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );
    });

  legendItems
    .append('span')
    .attr('class', 'swatch')
    .style('background', (_, i) => colors(i));

  legendItems
    .append('span')
    .text(d => `${d.label} (${d.value})`);
}

loadProjects();
