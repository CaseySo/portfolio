import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let projects = [];
let selectedIndex = -1;

const svg = d3.select('#projects-plot');
const legend = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');

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

  const searchInput = document.querySelector('.searchBar');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const query = e.target.value.toLowerCase();

      const filteredBySearch = projects.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        String(p.year).includes(query) ||
        p.description?.toLowerCase().includes(query)
      );``


      let finalList = filteredBySearch;
      if (selectedIndex !== -1) {
        const year = d3.selectAll('.legend li').data()[selectedIndex].label;
        finalList = filteredBySearch.filter(p => String(p.year) === String(year));
      }

      renderProjects(finalList, projectsContainer, 'h2');
      updateProjectCount(finalList);
    });
  }
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

      // Update visuals
      g.selectAll('path').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );
      legend.selectAll('li').attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );

      // Get current search query (if any)
      const searchInput = document.querySelector('#search');
      const query = searchInput?.value?.toLowerCase() || '';

      let filtered = projects.filter(p =>
        p.title?.toLowerCase().includes(query)
      );

      // If a slice is selected, filter by year too
      if (selectedIndex !== -1) {
        const year = data[selectedIndex].label;
        filtered = filtered.filter(p => String(p.year) === String(year));
      }

      renderProjects(filtered, projectsContainer, 'h2');
      updateProjectCount(filtered);
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

      const searchInput = document.querySelector('#search');
      const query = searchInput?.value?.toLowerCase() || '';

      let filtered = projects.filter(p =>
        p.title?.toLowerCase().includes(query)
      );

      if (selectedIndex !== -1) {
        const year = data[selectedIndex].label;
        filtered = filtered.filter(p => String(p.year) === String(year));
      }

      renderProjects(filtered, projectsContainer, 'h2');
      updateProjectCount(filtered);
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
