const blessed = require('blessed');
const EventEmitter = require('events');

class UI extends EventEmitter {
  constructor() {
    super();

    this.screen = null;
    this.lists = [];
    this.loader = null;
    this.messageBox = null;
    this.currentFocusedList = null;

    this.colors = {
      list: {
        focus: '#ffffff',
        blur: '#777777',
      },
      scrollbar: {
        bg: '#ffffff',
      },
      item: {
        fg: '#00ff00',
        selected: {
          fg: '#ffffff',
          bg: '#00ff00',
        },
      },
    };

    this.create();
    this.bindEvents();
    this.focusOnList(0);
  }

  debug(...args) {
    this.screen.debug(`[${Date.now()}] `, ...args);
  }

  bindEvents() {
    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    this.screen.key(['left', 'S-tab'], () => this.focusOnList(this.currentFocusedList.index - 1));
    this.screen.key(['right', 'tab'], () => this.focusOnList(this.currentFocusedList.index + 1));

    this.lists.forEach(({ name, widget }, index) => {
      widget.on('click', () => this.focusOnList(index));

      widget.on('select', (element) => {
        if (element) {
          this.debug('UI.select', name, `"${element.content}"`);
          this.emit('item:select', { list: name, index, value: element.content });
        }
      });
    });
  }

  showListLoader(index, message) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    for (let i = index + 1; i < this.lists.length; i += 1) {
      this.lists[i].widget.clearItems();
    }

    this.loader.load(message);

    const { widget } = this.lists[index];
    widget.clearItems();
    widget.append(this.loader);
  }

  hideListLoader(index) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.loader.stop();
    this.lists[index].widget.remove(this.loader);
  }

  setListItems(index, items) {
    this.debug('UI.setListItems', index, items);
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.hideListLoader(index);
    this.focusOnList(index);

    const { widget } = this.lists[index];
    widget.setItems(items);
    widget.select(0);
  }

  focusOnList(index) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.currentFocusedList = this.lists[index];
    this.currentFocusedList.widget.focus();
    this.render();
  }

  render() {
    this.debug('UI > start rendering');
    this.screen.render();
    this.debug('UI > done rendering');
  }

  showListMessage(index, message, callback, type = 'log') {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.hideListLoader(index);

    if (type === 'error') {
      this.messageBox.error(message, 3, callback);
    } else {
      this.messageBox.log(message, 3, callback);
    }

    const { widget } = this.lists[index];
    widget.clearItems();
    widget.append(this.messageBox);
  }

  showListError(index, error) {
    this.showListMessage(index, error, null, 'error');
  }

  create() {
    this.screen = this.createScreen();

    [
      'contexts',
      'namespaces',
      'releases',
      'revisions',
    ].forEach((name, index) => {
      const widget = this.createColumn({ name, left: `${index * 25 }%` });
      this.lists.push({ name, widget, index });
      this.screen.append(widget);
    });

    this.loader = this.createLoader();
    this.messageBox = this.createErrorBox();
  }

  createScreen() {
		const screen = blessed.screen({
      title: 'K8s Airways - Rollbacks made easy',
      width: '100%',
      autoPadding: true,
      smartCSR: true,
      debug: true,
    });

    return screen;
  }

  createColumn(options) {
    return blessed.List({
      name: '?',
      top: 0,
      left: 0,
      width: '25%',
      scrollable: true,
      mouse: true,
      keys: true,
      vi: false,
      border: {
        type: 'line',
        fg: this.colors.list.blur,
      },
      scrollbar: {
        bg: this.colors.scrollbar.bg,
      },
      style: {
        item: {
          fg: this.colors.item.fg,
        },
        selected: {
          fg: this.colors.item.selected.fg,
          bg: this.colors.item.selected.bg,
        },
        focus: {
          border: {
            fg: this.colors.list.focus,
          },
        },
      },
      ...options,
    });
  }

  createLoader() {
    return blessed.Loading();
  }

  createErrorBox() {
    return blessed.Message();
  }
}

module.exports = UI;
