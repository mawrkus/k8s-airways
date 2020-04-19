const blessed = require('blessed');
const EventEmitter = require('events');

function upperFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class UI extends EventEmitter {
  constructor(config) {
    super();

    this.screen = null;
    this.lists = [];
    this.loader = null;
    this.messageBox = null;
    this.currentFocusedList = null;

    this.config = config;

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
    this.createScreen();
    this.createColumns();
    this.createLoader();
    this.createErrorBox();
  }

  // eslint-disable-next-line class-methods-use-this
  createScreen() {
    this.screen = blessed.screen({
      title: '✈️ K8s Airways · Rollbacks made easy ✈️',
      width: '100%',
      autoPadding: true,
      smartCSR: true,
      debug: true,
    });
  }

  createColumns() {
    this.config.columns.forEach(({ name, left, width }, index) => {
      const { column, list } = this.createColumn({ name, left, width });
      this.screen.append(column);
      this.lists.push({ name, widget: list, index });
    });
  }

  createColumn(options) {
    const listHeader = blessed.Box({
      top: 0,
      left: 0,
      height: 1,
      width: '100%',
      content: ` {bold}${upperFirst(options.name)}{/bold}`,
      tags: true,
    });

    const list = blessed.List({
      name: '?',
      top: 1,
      left: 0,
      width: '100%',
      scrollable: true,
      mouse: true,
      keys: true,
      vi: false,
      border: {
        type: 'line',
        fg: this.config.colors.border.blur,
      },
      scrollbar: {
        bg: this.config.colors.scrollbar.bg,
      },
      style: {
        item: {
          fg: this.config.colors.item.fg,
        },
        selected: this.config.colors.item.selected,
        focus: {
          border: {
            fg: this.config.colors.border.focus,
          },
        },
      },
    });

    const column = blessed.Box({
      top: 0,
      left: 0,
      width: '25%',
      ...options,
    });

    column.append(listHeader);
    column.append(list);

    return { column, list, listHeader };
  }

  createLoader() {
    this.loader = blessed.Loading();
  }

  createErrorBox() {
    this.messageBox = blessed.Message();
  }
}

module.exports = UI;
