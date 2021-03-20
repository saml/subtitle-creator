// globals for debugging
let v = {
  file: null,
  url: null,
  input: document.querySelector('input#video-input'),
  player: document.querySelector('video#video'),
  text: document.querySelector('#text'),
  generate: document.querySelector('#generate-srt'),
  index: 0,
  time: 0,
  length: 0,
};

function onVideoLoaded(event) {
  v.file = event.target.files[0];
  v.url = URL.createObjectURL(v.file);
  v.player.src = v.url;
}

function onPaste(event) {
  const text = (event.clipboardData || window.clipboardData).getData('text');
  const lines = text.split('\n');
  const htmls = lines.map((line, i) => `<tr id="cue-${i}" class="cue">
    <td class="cue-control">
      <button class="remove" onclick="onClickCueRemove">x</button>
      <button class="add-above" onclick="onClickCueAddAbove">↑</button>
      <button class="add-below" onclick="onClickCueAddBelow">↓</button>
    </td>
    <td class="cue-time">${i === 0 ? 0 : ''}</td>
    <td class="cue-text">${line}</td>
  </tr>`);
  const table = `<table><tr><th>Controls</th><th>Timestamp</th><th>Text</th>${htmls.join('')}</table>`;
  v.text.innerHTML = table;
  v.length = htmls.length;
  updateCurrentCue();
  event.preventDefault();
}

function onClickCueRemove(event) {
  console.log('asdf');
}

function loadCue(cueIndex) {
  const cueRow = document.querySelector(`#cue-${cueIndex}`);
  const cueTimeCol = cueRow.querySelector('.cue-time');
  const cueTextCol = cueRow.querySelector('.cue-text');
  return {
    time: parseFloat(cueTimeCol.innerText),
    text: cueTextCol.innerText,
    number: cueIndex + 1,
  }
}

function secondsToTimestamp(secs) {
  return new Date(secs * 1000).toISOString().substr(11, 12).split('.').join(',');
}

function onClickCreateSubtitle(event) {
  const cues = [];
  const result = [];
  for (let i = 0; i < v.length; i++) {
    cues.push(loadCue(i));
  }
  for (let i = 0; i < cues.length; i++) {
    const nextCue = cues[i + 1];
    const cue = cues[i];
    const subtitle = {
      number: cue.number,
      start: cue.time,
      end: cue.time + 5, // by default, cue duration is 5 secs.
      text: cue.text,
    };
    if (nextCue) {
      subtitle.end = nextCue.time;
    }
    result.push(subtitle);
  }
  const srt = result.map((cue) => `${cue.number}
${secondsToTimestamp(cue.start)} --> ${secondsToTimestamp(cue.end)}
${cue.text}
`).join('\n');
  console.log(srt);
}

function onKeydown(event) {
  if (event.code === 'KeyJ') {
    document.querySelector(`#cue-${v.index}`).classList.remove('current');
    v.index++;
    const cueRow = document.querySelector(`#cue-${v.index}`);
    cueRow.classList.add('current');
    cueRow.querySelector('.cue-time').innerText = v.player.currentTime;
  }
}

function updateCurrentCue() {
  v.index = findCurrentCue();
  renderCurrentCue(v.index);
}

function findCurrentCue() {
  const currentTime = v.player.currentTime;
  for (let i = 0; i < v.length; i++) {
    const cueTimeCol = document.querySelector(`#cue-${i} .cue-time`);
    const secs = parseFloat(cueTimeCol.innerText);
    if (isNaN(secs) || secs >= currentTime) {
      return i;
    }
  }
  return 0;
}

function renderCurrentCue(cueIndex) {
  for (let i = 0; i < v.length; i++) {
    const cueRow = document.querySelector(`#cue-${i}`);
    if (i === cueIndex) {
      cueRow.classList.add('current');
    } else {
      cueRow.classList.remove('current');
    }
  }
}
v.input.addEventListener('change', onVideoLoaded);
v.text.addEventListener('paste', onPaste);
document.addEventListener('keydown', onKeydown);
v.generate.addEventListener('click', onClickCreateSubtitle);