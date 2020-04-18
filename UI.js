const blessed = require('blessed');
const EventEmitter = require('events');

class UI extends EventEmitter {
  constructor() {
    super();

    this.screen = null;
    this.lists = [];

    this.create();
    this.bindEvents();
    this.focusOnList(0);
    this.render();
  }

  debug(...args) {
    this.screen.debug(`[${Date.now()}] `, ...args);
  }

  bindEvents() {
    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

    const self = this;

    this.lists.forEach(({ name, widget }, index) => {
      widget.on('click', () => this.focusOnList(index));

      widget.on('select', function() {
        self.debug('select', name, `"${this.value}"`);
        self.emit('item:select', { list: name, index, value: this.value });
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
    this.render();

    this.debug('UI > done rendering');
  }

  focusOnList(index) {
    this.debug('UI.focusOnList', index);
    this.lists[index].widget.focus();
  }

  render() {
		this.screen.render();
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
      },
      scrollable: true,
      mouse: true,
      keys: true,
      vi: false,
      style: {
        item: {
          fg: '#00ff00',
        },
        selected: {
          bg: '#00ff00',
          fg: '#ffffff',
        },
      },
      ...options,
    });
  }
}

module.exports = UI;
