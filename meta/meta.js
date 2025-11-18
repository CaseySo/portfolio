import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

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

  // Create time scale
  timeScale = d3.scaleTime()
    .domain(d3.extent(allCommits, d => d.datetime))
    .range([0, 100]);

  // Attach slider listener
  const slider = document.getElementById('commit-progress');
  slider.addEventListener('input', onTimeSliderChange);

  // Initialize scatter
  onTimeSliderChange();

  // ------------------------------------
  // ✅ Step 3.2 — generate scrolly text
  // ------------------------------------
  d3.select('#scatter-story')
    .selectAll('.step')
    .data(allCommits)
    .join('div')
    .attr('class', 'step')
    .html((d, i) => `
      On ${d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
      })},
      I made <a href="${d.url}" target="_blank">${
        i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
      }</a>.
      I edited ${d.totalLines} lines across ${
        d3.rollups(d.lines, D => D.length, x => x.file).length
      } files.
      Then I looked over all I had made, and I saw that it was very good.
    `);
      //
  // Step 3.3 — Scrollama setup
  //
  const scroller = scrollama();

  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scatter-story .step',
      offset: 0.5, // triggers when a step hits middle of screen
    })
    .onStepEnter(onStepEnter);

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

  // Correct x-axis domain using datetime
  const minDate = d3.min(allCommits, d => d.datetime);
  const maxDate = commitMaxTime;
  xScale.domain([minDate, maxDate]).nice();


  // Update x-axis
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d'));
  svg.select('g.x-axis').call(xAxis);

  // Update radius scale
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([4, 30]);

  // Sort commits
  const sorted = d3.sort(commits, d => -d.totalLines);

  // Bind circles
  const circles = svg.select('g.circles')
    .selectAll('circle')
    .data(sorted, d => d.id);

  // Enter + update + exit (with tooltip handlers)
  circles.enter()
    .append('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mousemove', (event, d) => showTooltip(event, d))
    .on('mouseleave', hideTooltip)
  .merge(circles)
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines));

  circles.exit().remove();
}


// Tooltip helpers
function showTooltip(event, d) {
  const tooltip = d3.select('#commit-tooltip');
  tooltip.attr('hidden', null)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY + 15) + 'px');

  tooltip.select('#commit-link')
    .attr('href', d.url)
    .text(d.hash?.slice(0, 8) || 'Commit');

  tooltip.select('#commit-date').text(d.datetime.toLocaleDateString());
  tooltip.select('#commit-time-tooltip').text(d.datetime.toLocaleTimeString());
  tooltip.select('#commit-author').text(d.author);
  tooltip.select('#commit-lines').text(d.totalLines);
}

function hideTooltip() {
  d3.select('#commit-tooltip').attr('hidden', true);
}

function onStepEnter(response) {
  const commit = response.element.__data__; // the commit data Scrollama attached

  // Update scatter to this commit’s date
  commitMaxTime = commit.datetime;

  // Filter commits up to this point
  filteredCommits = allCommits.filter(d => d.datetime <= commitMaxTime);

  // Update the slider display too (optional)
  const slider = document.getElementById('commit-progress');
  slider.value = timeScale(commitMaxTime);

  // Update scatter + file display
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}


