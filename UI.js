const blessed = require('blessed');
const EventEmitter = require('events');

const config = require('./config/ui');

class UI extends EventEmitter {
  constructor(options) {
    super();

    this.screen = null;
    this.lists = [];
    this.loader = null;
    this.messageBox = null;
    this.currentFocusedList = null;

    this.options = {
      ...config,
      ...options,
    };

    this.create();
    this.bindEvents();
    this.focusOnList(0);
  }

  debug(...args) {
    this.screen.debug(`[${Date.now()}] `, ...args);
  }

  render() {
    this.debug('UI > start rendering');
    this.screen.render();
    this.debug('UI > done rendering');
  }

  setListItems(index, items) {
    this.debug('UI.setListItems', index, items);
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.hideListLoader(index);

    const { name, widget } = this.lists[index];

    if (!items.length) {
      this.showListMessage(index, `No ${name}.`);
      return;
    }

    this.focusOnList(index);
    widget.setItems(items);
    widget.select(0);
  }

  /* messages */

  showListMessage(index, message, type = 'log', timeout = 3) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.hideListLoader(index);

    if (type === 'error') {
      this.messageBox.error(message, timeout);
    } else {
      this.messageBox.log(message, timeout);
    }

    const { widget } = this.lists[index];
    widget.clearItems();
    widget.append(this.messageBox);

    this.render(); // required
  }

  showListError(index, error) {
    this.showListMessage(index, error, 'error');
  }

  /* loader */

  showListLoader(index, message) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    for (let i = index + 1; i < this.lists.length; i += 1) {
      this.lists[i].widget.clearItems();
      this.lists[i].widget.remove(this.messageBox);
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

  /* events */

  bindEvents() {
    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    this.screen.key(['left', 'S-tab'], () => this.focusOnList(this.currentFocusedList.index - 1));
    this.screen.key(['right', 'tab'], () => this.focusOnList(this.currentFocusedList.index + 1));

    this.lists.forEach(({ name, widget }, listIndex) => {
      widget.on('click', () => this.focusOnList(listIndex));

      widget.on('select', (element) => {
        if (element) {
          this.debug('UI.select', name, `"${element.content}"`);
          this.emit('item:select', { listName: name, listIndex, itemValue: element.content });
        }
      });
    });
  }

  focusOnList(index) {
    if (index < 0 || index >= this.lists.length) {
      return;
    }

    this.currentFocusedList = this.lists[index];
    this.currentFocusedList.widget.focus();
  }

  /* widgets creation */

  create() {
    this.screen = this.createScreen();
    this.lists = this.createLists();
    this.loader = this.createLoader();
    this.messageBox = this.createErrorBox();
  }

  // eslint-disable-next-line class-methods-use-this
  createScreen() {
    const screen = blessed.screen({
      title: '✈️ K8s Airways · Rollbacks made easy ✈️',
      width: '100%',
      autoPadding: true,
      smartCSR: true,
      debug: true,
    });

    return screen;
  }

  createLists() {
    return this.options.lists.map(({ name, left, width }, index) => {
      const widget = this.createColumn({ name, left, width });
      this.screen.append(widget);
      return { name, widget, index };
    });
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
        fg: this.options.colors.border.blur,
      },
      scrollbar: {
        bg: this.options.colors.scrollbar.bg,
      },
      style: {
        item: {
          fg: this.options.colors.item.fg,
        },
        selected: this.options.colors.item.selected,
        focus: {
          border: {
            fg: this.options.colors.border.focus,
          },
        },
      },
      ...options,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  createLoader() {
    return blessed.Loading();
  }

  // eslint-disable-next-line class-methods-use-this
  createErrorBox() {
    return blessed.Message();
  }
}

module.exports = UI;
