class Cues {
  constructor(tbody) {
    this.tbody = tbody;
    this.start();
  }

  start() {
    this.tbody.addEventListener('click', (event) => {
      if (event.target.tagName === 'TD') {
        const row = event.target.parentElement;
        const prevRow = this.getCurrent();
        this.switchCurrentRow(prevRow, row.sectionRowIndex);
      }
    });
  }

  setTime(time) {
    const row = this.getCurrent();
    row.querySelector('.cue-time').innerText = time;
  }

  getCurrent() {
    return this.tbody.querySelector('.current');
  }

  moveDown() {
    const row = this.getCurrent();
    this.switchCurrentRow(row, row.sectionRowIndex + 1);
  }

  moveUp() {
    const row = this.getCurrent();
    this.switchCurrentRow(row, row.sectionRowIndex - 1);
  }

  addRowBelow() {
    const row = this.getCurrent();
    const newRow = this.tbody.insertRow(row.sectionRowIndex + 1);
    this.makeCueRow(newRow);
    this.switchCurrentRow(row, newRow.sectionRowIndex);
  }

  makeCueRow(row) {
    const timeCol = document.createElement('td');
    timeCol.classList.add('cue-time');
    row.appendChild(timeCol);

    const textCol = document.createElement('td');
    textCol.classList.add('cue-text');
    row.appendChild(textCol);

    row.classList.add('cue');
    row.id = `cue-${row.rowIndex}`;
    return row;
  }

  switchCurrentRow(row, targetIndex) {
    const target = row.parentElement.rows[targetIndex];
    if (!target) {
      // nothing to do.
      return false;
    }
    row.classList.remove('current');
    target.classList.add('current');
    return true;
  }
};

let v = {
  file: null,
  url: null,
  input: document.querySelector('input#video-input'),
  player: document.querySelector('video#video'),
  cues: new Cues(document.querySelector('#cues').tBodies[0]),
  cueIndex: 0,
  generate: document.querySelector('#generate-srt'),
  index: 0,
  time: 0,
  length: 0,
  siblings(elem) {
    return Array.prototype.filter.call(elem.parentNode.children, (sibling) => {
      return sibling !== elem;
    });
  },
  isInEdit() {
    return document.activeElement.isContentEditable;
  },
  start() {
    document.addEventListener('keydown', (event) => {
      this.onKeydown(event)
    });

  },
  normalKeydown(event) {
    switch (event.code) {
      case 'Enter':
        this.cues.addRowBelow();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.cues.moveUp();
        break;
      case 'ArrowDown':
        this.cues.moveDown();
        break;
      default:
        break;
    }
  },
  playingKeydown(event) {
    switch (event.code) {
      case 'Enter':
        this.cues.setTime(this.player.currentTime);
        this.cues.moveDown();
        break;
      default:
        break;
    }
  },
  onKeydown(event) {
    if (this.player.paused) {
      this.normalKeydown(event);
    } else {
      this.playingKeydown(event);
    }
  }
  // Cue (table)
};



v.start();

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



function setCurrentByIndex(rowIndex, table = v.cues) {
  setCurrent(table.rows[rowIndex]);
}





function onKeydown(event) {
  console.log(v.isInEdit());
  if (event.code === 'KeyJ') {
    document.querySelector(`#cue-${v.index}`).classList.remove('current');
    v.index++;
    const cueRow = document.querySelector(`#cue-${v.index}`);
    cueRow.classList.add('current');
    cueRow.querySelector('.cue-time').innerText = v.player.currentTime;
  } else if (event.code === 'ArrowDown') {
    const row = v.cues.querySelector('.current');
    switchCurrentRow(row, row.sectionRowIndex + 1);
  } else if (event.code === 'ArrowUp') {
    const row = v.cues.querySelector('.current');
    switchCurrentRow(row, row.sectionRowIndex - 1);
  } else if (event.code === 'Enter') {
    const row = v.cues.querySelector('.current');
    const newRow = v.cues.insertRow(row.sectionRowIndex + 1);
    makeCueRow(newRow);
    switchCurrentRow(row, newRow.sectionRowIndex);
  } else if (event.code === 'Delete') {
    const row = v.cues.querySelector('.current');
    let rowIndex = row.sectionRowIndex;
    v.cues.deleteRow(rowIndex);
    rowIndex--;
    if (rowIndex < 0) {
      rowIndex = 0;
    }
    let currentRow = v.cues.rows[rowIndex];
    if (!currentRow) {
      currentRow = v.cues.insertRow(0);
      makeCueRow(currentRow);
    }
    currentRow.classList.add('current');
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
// v.cues.addEventListener('paste', onPaste);


v.generate.addEventListener('click', onClickCreateSubtitle);