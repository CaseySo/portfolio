import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { initMeta, updateScatterPlot, allCommits, filteredCommits } from './meta.js';

let xScale, yScale;
let selectedCommits = [];
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];

      const ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author: first.author,
        date: first.date,
        time: first.time,
        timezone: first.timezone,
        datetime: first.datetime,
        hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').text('Commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles);

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Max Depth');
  dl.append('dd').text(d3.max(data, d => d.depth));

  dl.append('dt').text('Longest Line');
  dl.append('dd').text(d3.max(data, d => d.length));

  dl.append('dt').text('Max Lines/Commit');
  dl.append('dd').text(d3.max(commits, d => d.totalLines));
}
function updateFileDisplay(filteredCommits) {
  // Flatten all lines from filtered commits
  const lines = filteredCommits.flatMap(d => d.lines);

  // Group by file, convert to array, and sort by size (DESC)
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  // Bind data to <div> items inside <dl id="files">
  const filesContainer = d3.select('#files')
  .selectAll('div')
  .data(files, d => d.name)
  .join(
    enter => enter.append('div').call(div => {
      div.append('dt').append('code');
      div.append('dd');
    })
  );


  // Update filename + line count (in <dt>)
  filesContainer.select('dt > code')
    .html(d => `${d.name}<br><small>${d.lines.length} lines</small>`);

  // UNIT VISUALIZATION: one dot per line
  filesContainer
  .select('dd')
  .selectAll('.loc')
  .data(d => d.lines)
  .join('div')
  .attr('class', 'loc')
  .style('background', line => colorScale(line.type));

}

async function main() {
  const data = await loadData();
  const commits = processCommits(data);

  renderCommitInfo(data, commits);

  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 50, left: 70 };

  const svg = d3.select('#chart-container')
    .append('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('width', width)
    .attr('height', height);

  // Scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.date))
    .range([margin.left, width - margin.right]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-(width - margin.left - margin.right))
    );

  // Axes
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(12).tickFormat(d => `${d}:00`));

  // Labels
  svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', width / 2)
    .attr('y', margin.top / 3)
    .attr('text-anchor', 'middle')
    .text('Commits by Date and Time of Day');

  svg.append('text')
    .attr('class', 'x-axis-label')
    .attr('x', width / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .text('Date');

  svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .text('Time of Day (hours)');

  // Circle layer
  svg.append('g').attr('class', 'circles');

  // Brush
  createBrushSelector(svg);

  // --------------------------------------------------
  // INITIAL RENDER
  // --------------------------------------------------

  // Initialize meta + slider system
  initMeta(commits, xScale, yScale);

  // Initial view should show ALL commits
  updateScatterPlot(commits);

  // Initial file display shows ALL files/lines
  updateFileDisplay(commits);
}


// --------------------------------------------------
// TOOLTIP + BRUSH
// --------------------------------------------------

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time-tooltip'); // FIXED
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime.toLocaleString();
  time.textContent = commit.datetime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = event.clientX + 10 + 'px';
  tooltip.style.top = event.clientY + 10 + 'px';
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));

  // FIX: raise entire circle layer, not individual circles
  svg.select('g.circles').raise();
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.date);
  const cy = yScale(commit.hourFrac);
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection) {
  const selected = selection
    ? allCommits.filter(d => isCommitSelected(selection, d))
    : [];

  selectedCommits = selected;

  document.getElementById('selection-count').textContent =
    `${selected.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selection) {
  const selected = selection
    ? allCommits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');
  if (!selected.length) {
    container.innerHTML = '';
    return;
  }

  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${d3.format('.1~%')(proportion)})</dd>
    `;
  }
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('g.circles circle')
    .classed('selected', d => isCommitSelected(selection, d));

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

main();
export { updateFileDisplay };
