import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let projects = [];
let selectedIndex = -1;
let query = '';

async function loadProjects() {
  const jsonPath = '../lib/projects.json';
  projects = await fetchJSON(jsonPath);

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  renderPieChart(projects);
  setupSearch();
}
function setupSearch() {
  let searchInput = document.querySelector('.searchBar');
  let projectsContainer = document.querySelector('.projects');

  searchInput.addEventListener('input', (event) => {
    query = event.target.value;

    let filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });
}

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');
  const projectsContainer = document.querySelector('.projects');

  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  let rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  let data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const arcs = pie(data);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  svg
    .selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colors(i))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''))
    .on('click', (_, d, i) => {
      selectedIndex = selectedIndex === i ? -1 : i;

      // Filter or reset projects
      if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
        renderPieChart(projects);
      } else {
        let year = d.data.label;
        let filtered = projects.filter(p => p.year === year);
        renderProjects(filtered, projectsContainer, 'h2');
        renderPieChart(filtered);
      }
    });

  legend
    .selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .html(d => `<span class="swatch" style="background:${colors(d.label)}"></span>${d.label} (${d.value})`)
    .on('click', (_, d) => {
      let filtered = projects.filter(p => p.year === d.label);
      renderProjects(filtered, projectsContainer, 'h2');
      renderPieChart(filtered);
    });
}

loadProjects();
