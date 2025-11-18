import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export let allCommits = [];
export let filteredCommits = [];
export let xScale, yScale;
import { updateFileDisplay } from './main.js';

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

  // Create time scale for the slider (0–100)
  timeScale = d3.scaleTime()
    .domain(d3.extent(allCommits, d => d.datetime))
    .range([0, 100]);

  // Attach slider listener
  const slider = document.getElementById('commit-progress');
  slider.addEventListener('input', onTimeSliderChange);
    
  // Initialize scatter plot with current slider value
  onTimeSliderChange();
}

/**
 * Slider change handler
 */
function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const progress = +slider.value;

  // Convert slider value to datetime
  commitMaxTime = timeScale.invert(progress);

  // Update current date label
  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString();

  // Filter commits up to current slider time
  filteredCommits = allCommits.filter(d => d.datetime <= commitMaxTime);
  
  // 1. Flatten all lines from filtered commits
  let lines = filteredCommits.flatMap(d => d.lines);

    // 2. Group lines by file
  let files = d3.groups(lines, d => d.file)
  .map(([name, lines]) => ({ name, lines }));

  // Update scatter plot
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

/**
 * Update scatter plot (jump mode, no transition)
 */
export function updateScatterPlot(commits) {
  const svg = d3.select('#chart-container').select('svg');
  if (svg.size() === 0) return;

  // x-axis: earliest commit to current slider time
  const minDate = d3.min(allCommits, d => d.date);
  const maxDate = commitMaxTime;
  xScale.domain([minDate, maxDate]).nice();

  // Update x-axis
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d'));
  svg.select('g.x-axis').call(xAxis);

  // Update radius scale
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 30]);

  // Sort commits so larger circles are on top
  const sorted = d3.sort(commits, d => -d.totalLines);

  // Bind circles
  const circles = svg.select('g.circles')
    .selectAll('circle')
    .data(sorted, d => d.id);

  // Enter new circles
  circles.enter()
    .append('circle')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7);

  // Update existing circles
  circles
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines));

  // Remove circles outside filtered commits
  circles.exit().remove();
}


