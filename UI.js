const blessed = require('blessed');
const EventEmitter = require('events');

class UI extends EventEmitter {
  constructor() {
    super();

    this.screen = null;
    this.lists = [];
    this.currentFocusedList = null;
    this.colors = {
      focus: '#ffffff',
      blur: '#777777',
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

    this.lists.forEach(({ name, widget }, index) => {
      widget.on('click', () => this.focusOnList(index));

      widget.on('action', (element) => {
        this.focusOnList(index); // to make it work when selecting with the mouse
      });

      widget.on('select', (element) => {
        this.debug('UI.select', name, `"${element.content}"`);
        this.emit('item:select', { list: name, index, value: element.content });
      });
    });
  }

  setListItems(index, items) {
    this.debug('UI.setListItems', index, items);

    for (let i = index + 1; i < this.lists.length; i += 1) {
      this.lists[i].widget.clearItems();
    }

    const { widget } = this.lists[index];
    widget.setItems(items);
    this.focusOnList(index);
  }

  focusOnList(index) {
    this.debug('UI.focusOnList', index);

    if (this.currentFocusedList) {
      this.currentFocusedList.widget.style.border.fg = this.colors.blur;
    }

    this.currentFocusedList = this.lists[index];
    this.currentFocusedList.widget.style.border.fg = this.colors.focus;
    this.currentFocusedList.widget.focus();

    this.render();
  }

  render() {
    this.debug('UI > start rendering');
    this.screen.render();
    this.debug('UI > done rendering');
	}

  create() {
    this.screen = this.createScreen();

    [
      'contexts',
      'namespaces',
      'releases',
      'versions',
    ].forEach((name, i) => {
      const widget = this.createColumn({ name, left: `${i * 25 }%` });

      this.lists.push({ name, widget });

      this.screen.append(widget);
    });
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
      border: {
        type: 'line',
        fg: this.colors.blur,
      },
      scrollable: true,
      keys: true,
      vi: false,
      mouse: false,
      style: {
        item: {
          fg: this.colors.item.fg,
        },
        selected: {
          fg: this.colors.item.selected.fg,
          bg: this.colors.item.selected.bg,
        },
      },
      ...options,
    });
  }
}

module.exports = UI;
