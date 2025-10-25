import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadProjects() {
  const isProjectsPage = location.pathname.includes('/projects/');
  const jsonPath = isProjectsPage ? '../lib/projects.json' : 'lib/projects.json';

  const projects = await fetchJSON(jsonPath);
  if (!projects) return;

  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `Projects (${projects.length})`;
  }

  const container = document.querySelector('.projects');
  renderProjects(projects, container, 'h2');

  renderPieChart(projects);
}
loadProjects();

const svg = d3.select('#projects-plot');
const legend = d3.select('.legend');

function renderPieChart(projects) {
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(projects, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

  const pie = d3.pie().value(d => d.value);
  const arcData = pie(data);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arc(d))
      .attr('fill', colors(i))
      .attr('data-year', d.data.label)
      .attr('class', 'slice')
      .attr('stroke', 'white')
      .attr('stroke-width', 1);
  });

  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

const searchInput = document.querySelector('.searchBar');

searchInput?.addEventListener('input', async (event) => {
  const query = event.target.value.toLowerCase();
  const projects = await fetchJSON('../lib/projects.json');

  const filtered = projects.filter(p =>
    Object.values(p).join(' ').toLowerCase().includes(query)
  );

  renderProjects(filtered, document.querySelector('.projects'), 'h2');
  renderPieChart(filtered);
});

svg.on('click', async (event) => {
  const clicked = event.target.closest('.slice');
  if (!clicked) return;

  const year = clicked.getAttribute('data-year');
  const projects = await fetchJSON('../lib/projects.json');
  const filtered = projects.filter(p => p.year === year);

  renderProjects(filtered, document.querySelector('.projects'), 'h2');
  renderPieChart(filtered);
});
