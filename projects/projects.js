import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let allProjects = [];
let currentFilter = null;

async function loadProjects() {
  const isProjectsPage = location.pathname.includes('/projects/');
  const jsonPath = isProjectsPage ? '../lib/projects.json' : 'lib/projects.json';

  allProjects = await fetchJSON(jsonPath);
  if (!allProjects) {
    console.error("No project data found");
    return;
  }

  const title = document.querySelector('.projects-title');
  if (title) title.textContent = `Projects (${allProjects.length})`;

  const projectsContainer = document.querySelector('.projects');
  renderProjects(allProjects, projectsContainer, 'h2');

  setupSearch();
  renderProjectsChart(allProjects);
}

function setupSearch() {
  const searchInput = document.getElementById('project-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    const filtered = allProjects.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
    renderProjects(filtered, document.querySelector('.projects'), 'h2');
    renderProjectsChart(filtered);
  });
}

function renderProjectsChart(projects) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const counts = d3.rollups(projects, v => v.length, d => d.year)
    .map(([year, count]) => ({ year, count }));

  if (counts.length === 0) return;

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const pieData = pie(counts);

  svg.selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colors(i))
    .attr('stroke', 'white')
    .attr('stroke-width', 1.5)
    .attr('data-year', d => d.data.year)
    .on('mouseover', function () {
      d3.select(this).attr('filter', 'drop-shadow(0 0 5px white)');
    })
    .on('mouseout', function () {
      d3.select(this).attr('filter', null);
    });

  const legendItems = legend.selectAll('li')
    .data(counts)
    .enter()
    .append('li')
    .attr('style', (d, i) => `--color:${colors(i)}`)
    .html(d => `<span class="swatch"></span>${d.year} <em>(${d.count})</em>`)
    .on('click', (event, d) => handleLegendClick(d.year))
    .on('mouseover', function () {
      d3.select(this).classed('hover', true);
    })
    .on('mouseout', function () {
      d3.select(this).classed('hover', false);
    });
}

function handleLegendClick(year) {
  const projectsContainer = document.querySelector('.projects');

  if (currentFilter === year) {
    renderProjects(allProjects, projectsContainer, 'h2');
    renderProjectsChart(allProjects);
    currentFilter = null;
  } else {
    const filtered = allProjects.filter(p => p.year === year);
    renderProjects(filtered, projectsContainer, 'h2');
    renderProjectsChart(filtered);
    currentFilter = year;
  }
}

loadProjects();
