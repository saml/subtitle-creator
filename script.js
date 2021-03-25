class Cues {
  constructor(tbody) {
    this.tbody = tbody;
    this.stopListening = false;
    this.start();
  }

  start() {
    this.stopListening = false;

    this.tbody.addEventListener('click', (event) => {
      if (this.stopListening) {
        return;
      }
      if (event.target.tagName === 'TD') {
        const row = event.target.parentElement;
        const prevRow = this.getCurrent();
        this.switchCurrentRow(prevRow, row.sectionRowIndex);
      }
    });

    this.tbody.parentElement.addEventListener('paste', (event) => {
      if (this.stopListening) {
        return;
      }
      this.onPaste(event);
    });
  }

  toJSON() {
    const result = [];
    for (let i = 0; i < this.tbody.rows.length; i++) {
      const row = this.tbody.rows[i];
      const text = this.getText(row).innerText;
      const time = parseFloat(this.getTime(row).innerText);
      result.push({
        number: i + 1,
        time,
        text,
      });
    }
    return result;
  }

  getText(row) {
    return row.querySelector('.cue-text');
  }

  setText(text, row) {
    if (!row) {
      row = this.getCurrent();
    }
    this.getText(row).innerText = text;
  }

  getTime(row) {
    return row.querySelector('.cue-time');
  }

  setTime(time) {
    const row = this.getCurrent();
    this.getTime(row).innerText = time;
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
    const newRow = this.addRowAt(row.sectionRowIndex + 1);
    this.switchCurrentRow(row, newRow.sectionRowIndex);
  }

  addRowAt(index) {
    const row = this.tbody.insertRow(index);
    this.makeCueRow(row);
    return row;
  }

  deleteTime() {
    const row = this.getCurrent();
    this.getTime(row).innerText = '';
  }

  removeRow() {
    const row = this.getCurrent();

    // next current will be the row below
    let nextIndex = row.sectionRowIndex + 1;
    if (nextIndex >= this.tbody.rows.length) {
      // there is no row below. next current will be row above.
      nextIndex = row.sectionRowIndex - 1;
    }
    this.switchCurrentRow(row, nextIndex);

    this.tbody.deleteRow(row.sectionRowIndex);

    if (this.tbody.rows.length === 0) {
      // last remaining row got removed. create one.
      const newRow = this.addRowAt(0);
      newRow.classList.add('current');
      return;
    }
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

  onPaste(event) {
    const text = (event.clipboardData || window.clipboardData).getData('text');
    const lines = text.split('\n');
    const currentRow = this.getCurrent();
    const start = currentRow.sectionRowIndex;
    const n = start + lines.length;
    for (let i = start; i < n; i++) {
      let row = this.tbody.rows[i];
      if (!row) {
        row = this.addRowAt(i);
      }
      this.setText(lines[i - start], row);
    }
    event.preventDefault();
  }
};

class VideoPlayer {
  constructor({
    fileInput,
    player
  }) {
    this.fileInput = fileInput;
    this.player = player;
    this.url = null;
    this.configureHandlers();
  }

  configureHandlers() {
    this.fileInput.addEventListener('change', (event) => {
      this.onVideoLoaded(event);
    });
  }

  onVideoLoaded(event) {
    const file = event.target.files[0];
    if (this.url) {
      URL.revokeObjectURL(this.url);
    }
    this.url = URL.createObjectURL(file);
    this.player.src = this.url;
  }
}


class SubtitleExporter {
  constructor({
    submitButton,
    downloadLink,
    cues
  }) {
    this.submitButton = submitButton;
    this.downloadLink = downloadLink;
    this.cues = cues;
    this.url = null;
    this.configureHandlers();
  }

  configureHandlers() {
    this.submitButton.addEventListener('click', (event) => {
      this.exportSubtitle();
    });
  }

  exportSubtitle() {
    this.downloadTextFile(this.dumpSubtitle(this.cues.toJSON()));
  }

  downloadTextFile(text, fileName) {
    if (!fileName) {
      fileName = 'a.srt';
    }
    const blob = new Blob([text], {
      type: 'text/plain'
    });

    if (this.url) {
      URL.revokeObjectURL(this.url);
    }
    this.url = URL.createObjectURL(blob);

    this.downloadLink.href = this.url;
    this.downloadLink.download = fileName;
    this.downloadLink.click();
  }

  secondsToTimestamp(secs) {
    return new Date(secs * 1000).toISOString().substr(11, 12).split('.').join(',');
  }

  dumpSubtitle(cues) {
    const result = [];
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
    return result.map((cue) => `${cue.number}
${this.secondsToTimestamp(cue.start)} --> ${this.secondsToTimestamp(cue.end)}
${cue.text}
`).join('\n');
  }
}

const player = new VideoPlayer({
  fileInput: document.querySelector('input#video-input'),
  player: document.querySelector('video#video')
});

const cues = new Cues(document.querySelector('#cues').tBodies[0]);

const exporter = new SubtitleExporter({
  submitButton: document.querySelector('#generate-srt'),
  cues,
  downloadLink: document.querySelector('#download-srt'),
});

let v = {
  player,
  cues,
  exporter,
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
      case 'Delete':
        if (event.shiftKey) {
          this.cues.deleteTime();
        } else {
          this.cues.removeRow();
        }
        break;
      default:
        break;
    }
  },
  playingKeydown(event) {
    switch (event.code) {
      case 'Enter':
        this.cues.setTime(this.player.player.currentTime);
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
  },

};

v.start();