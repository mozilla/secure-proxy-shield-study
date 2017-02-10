const port = browser.runtime.connect({ name: 'connection-to-legacy' });

/*
TODO: Add all code which passes messages from Advisor.js to popup.js
and vice versa. For example, in previous version of add-on, Advisor.js would
control when to show and hide the popup. With bootstrapped webExtension, this
action will now be controlled here. See the showPanel method in Advisor.js,
which sends a message to be handled here (show the panel).
*/
