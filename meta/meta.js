import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { updateFileDisplay } from './main.js';

export let allCommits = [];
export let filteredCommits = [];
export let xScale, yScale;

let timeScale;
let commitMaxTime;

/**
 * Initialize slider + time scale after commits are loaded
 */
export function initMeta(commits, x, y) {
  allCommits = commits;
  filteredCommits = commits;
  xScale = x;
  yScale = y;

  timeScale = d3.scaleTime()
    .domain(d3.extent(allCommits, d => d.datetime))
    .range([0, 100]);

  const slider = document.getElementById('commit-progress');
  slider.addEventListener('input', onTimeSliderChange);

  // initial
  onTimeSliderChange();
}

/**
 * Slider change handler
 */
function onTimeSliderChange() {
  const progress = +document.getElementById('commit-progress').value;

  commitMaxTime = timeScale.invert(progress);

  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString();

  filteredCommits = allCommits.filter(d => d.datetime <= commitMaxTime);

  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

/**
 * Update scatter plot (jump mode)
 */
export function updateScatterPlot(commits) {
  const svg = d3.select('#chart-container').select('svg');
  if (svg.size() === 0) return;

  const minDate = d3.min(allCommits, d => d.date);
  const maxDate = commitMaxTime;
  xScale.domain([minDate, maxDate]).nice();

  svg.select('g.x-axis')
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 30]);

  const sorted = d3.sort(commits, d => -d.totalLines);

  const circles = svg.select('g.circles')
    .selectAll('circle')
    .data(sorted, d => d.id);

  circles.enter()
    .append('circle')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7);

  circles
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines));

  circles.exit().remove();
}
