import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let projects = [];
let selectedIndex = -1;

const svg = d3.select('#projects-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');

// --- Update the count next to "Projects" ---
function updateProjectCount(list) {
  if (title) {
    title.textContent = `Projects (${list.length})`;
  }
}

async function loadProjects() {
  const data = await fetchJSON('../lib/projects.json');
  if (!data) return;
  projects = data;

  renderProjects(projects, projectsContainer, 'h2');
  updateProjectCount(projects);
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
    .on('click', function (event, d) {
      const i = data.findIndex(e => e.label === d.data.label);
      selectedIndex = selectedIndex === i ? -1 : i;

      g.selectAll('path').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );
      legend.selectAll('li').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );

      if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
      } else {
        const year = data[selectedIndex].label;
        const filtered = projects.filter(p => String(p.year) === String(year));
        renderProjects(filtered, projectsContainer, 'h2');
      }
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

      if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
      } else {
        const year = data[selectedIndex].label;
        const filtered = projects.filter(p => p.year === year);
        renderProjects(filtered, projectsContainer, 'h2');
      }


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
