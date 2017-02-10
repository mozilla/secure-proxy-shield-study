function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (let name of Object.keys(attrs)) { // eslint-disable-line prefer-const
    element[name] = attrs[name];
  }
  for (let child of children) { // eslint-disable-line prefer-const
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

class Notify {
  start() {
    this.port = browser.runtime.connect({ name: 'connection-to-legacy' });
    this.target = document.body.appendChild(el('div'));
    const methodsToBind = ['handleSafeNetwork', 'handleUnsafeNetwork',
                           'handleMoreInfo', 'handleDisable', 'handleSignup',
                           'handleNoSignup', 'handleClose'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.port.onMessage.addListener((message) => {
      if (message === 'newNetwork') {
        this.render('warn');
      }
    });
  }

  render(boxType) {
    const newPanel = el('div', { id: 'panel' });
    newPanel.appendChild(this.createBox(boxType));
    const currentPanel = this.target.children[0];
    if (currentPanel) {
      this.target.replaceChild(newPanel, currentPanel);
    } else {
      this.target.appendChild(newPanel);
    }
  }

  createBox(boxType) {
    return el('div', {},
      el('div', { className: 'info-box' },
        this.createHeader(boxType),
        this.createMessage(boxType)
      ),
      this.createFooter(boxType)
    );
  }

  createHeader(boxType) {
    if (boxType === 'moreInfo' || boxType === 'warn') {
      return el('div', { className: 'title' },
        el('img', { src: 'warningRed.svg' }),
        el('h1', {}, 'This network may be unsafe!')
      );
    } else if (boxType === 'safe') {
      return el('div', { className: 'title' },
        el('img', { src: 'warningRed.svg' }),
        el('h1', {}, "Great! You're safe")
      );
    }
    // boxType === 'unsafe'
    return el('div', { className: 'title' },
      el('img', { src: 'warningRed.svg' }),
      el('h1', {}, 'You are at risk!')
    );
  }

  createMessage(boxType) {
    if (boxType === 'warn') {
      return el('div', {},
        el('p', {},
          `Depending on the type of network you're using right now, you
          may be at risk of adversaries evesdropping or tampering with your
          Internet browsing. `,
          el('a', { onclick: this.handleMoreInfo }, 'Learn more...')
        ),
        el('p', {},
          'Which type of network are you currently using?'
        )
      );
    } else if (boxType === 'moreInfo') {
      return el('div', {},
        el('p', {},
          `Public WiFi networks do not provide adequate protection against
          evesdropping or tampering by hackers. But don't worry! If you're on
          a public network, we can help you stay safe.`
        ),
        el('p', {},
          "If you don't wish to recieve these notifcations anymore, you can ",
          el('a', { onclick: this.handleDisable }, 'disable all future warnings.')
        )
      );
    } else if (boxType === 'safe') {
      return el('div', {},
        el('p', {}, `Your current network is likely safe. We'll keep an eye out
                    and let you know if we think you may be at risk.`)
      );
    }
    // boxType === 'unsafe'
    return el('div', {},
      el('p', {}, `This WiFi network probably doesn't provide enough protection
      from hackers evesdropping or tampering with your connection. But we can help!
      `),
      el('p', {}, `
      Try Firefox Safe Browsing, and we'll protect you so that you can browse the web
      on public WiFi without fear!
      `)
    );
  }

  createFooter(boxType) {
    if (boxType === 'warn' || boxType === 'moreInfo') {
      return el('footer', {},
        el('div', { onclick: this.handleSafeNetwork }, 'Home / Office WiFi'),
        el('div', { onclick: this.handleUnsafeNetwork }, 'Public WiFi')
      );
    }
    if (boxType === 'unsafe') {
      return el('footer', {},
        el('div', { onclick: this.handleSignup }, 'No thanks'),
        el('div', { onclick: this.handleNoSignup }, 'Use Firefox VPN')
      );
    }
    // boxType === safe
    return el('footer', {},
      el('div', { onclick: this.handleClose }, 'Close')
    );
  }

  handleMoreInfo() {
    this.render('moreInfo');
  }

  handleSafeNetwork() {
    this.port.sendMessage('safe');
    this.render('safe');
  }

  handleUnsafeNetwork() {
    this.port.sendMessage('unsafe');
    this.render('unsafe');
  }

  handleSignup() {
    this.port.sendMessage('signup');
  }

  handleNoSignup() {
    this.port.sendMessage('noSignup');
  }

  handleClose() {
    this.port.sendMessage('close');
  }

  handleDisable() {
    this.port.sendMessage('disable');
  }
}

const notify = new Notify();
notify.start();
